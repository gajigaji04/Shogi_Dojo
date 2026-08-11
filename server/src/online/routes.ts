// Online PVP, rebuilt on plain HTTP polling instead of WebSocket, so it runs
// correctly on stateless serverless functions (Vercel): no in-memory queue, no
// in-memory game rooms, no persistent socket. Every operation reads/writes Postgres;
// two clients "talk" to each other only by polling the same Game row.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import type { AuthedRequest } from "../auth/middleware.js";
import { gameReducer } from "../../../src/game/state/gameReducer.js";
import { createInitialGameState } from "../../../src/game/state/gameState.js";
import type { GameState, Move, Player } from "../../../src/game/types/shogi.js";

export const onlineRouter = Router();

const TIMEOUT_MS = 90_000; // no move in 90s -> opponent may claim the win

function colorOf(game: { player1Id: string; player2Id: string }, userId: string): Player | null {
  if (game.player1Id === userId) return "sente";
  if (game.player2Id === userId) return "gote";
  return null;
}

function winnerIdOf(game: { player1Id: string; player2Id: string }, state: GameState): string | null {
  if (!state.winner) return null;
  return state.winner === "sente" ? game.player1Id : game.player2Id;
}

/** Join the queue, or get matched immediately if someone is already waiting.
 * A Postgres advisory lock serializes concurrent joins so two players who hit
 * "join" at the same instant can't both fail to find each other. */
onlineRouter.post("/queue/join", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const activeGame = await prisma.game.findFirst({
    where: { status: "PLAYING", OR: [{ player1Id: userId }, { player2Id: userId }] },
  });
  if (activeGame) {
    res.json({ matched: true, gameId: activeGame.id, color: colorOf(activeGame, userId) });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(727272)`;

    await tx.matchQueue.deleteMany({ where: { userId } });
    const opponentEntry = await tx.matchQueue.findFirst({
      where: { userId: { not: userId } },
      orderBy: { createdAt: "asc" },
    });

    if (!opponentEntry) {
      await tx.matchQueue.create({ data: { userId } });
      return { matched: false as const };
    }

    await tx.matchQueue.delete({ where: { userId: opponentEntry.userId } });
    const initialState = createInitialGameState();
    const game = await tx.game.create({
      data: {
        player1Id: opponentEntry.userId,
        player2Id: userId,
        status: "PLAYING",
        stateJson: initialState as unknown as object,
        lastMoveAt: new Date(),
      },
    });
    return { matched: true as const, gameId: game.id, color: "gote" as Player };
  });

  res.json(result);
});

onlineRouter.post("/queue/leave", requireAuth, async (req: AuthedRequest, res) => {
  await prisma.matchQueue.deleteMany({ where: { userId: req.userId! } });
  res.json({ success: true });
});

onlineRouter.get("/queue/status", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const activeGame = await prisma.game.findFirst({
    where: { status: "PLAYING", OR: [{ player1Id: userId }, { player2Id: userId }] },
    include: { player1: true, player2: true },
  });
  if (activeGame) {
    const color = colorOf(activeGame, userId)!;
    const opponent = color === "sente" ? activeGame.player2 : activeGame.player1;
    res.json({ matched: true, gameId: activeGame.id, color, opponent: { nickname: opponent.nickname } });
    return;
  }
  const queued = await prisma.matchQueue.findUnique({ where: { userId } });
  res.json({ matched: false, queued: !!queued });
});

async function loadAuthorizedGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { player1: true, player2: true },
  });
  if (!game) return { error: "NOT_FOUND" as const };
  const color = colorOf(game, userId);
  if (!color) return { error: "FORBIDDEN" as const };
  return { game, color };
}

onlineRouter.get("/games/:id/state", requireAuth, async (req: AuthedRequest, res) => {
  const loaded = await loadAuthorizedGame(req.params.id, req.userId!);
  if ("error" in loaded) {
    res.status(loaded.error === "NOT_FOUND" ? 404 : 403).json({ error: loaded.error });
    return;
  }
  const { game, color } = loaded;
  const opponent = color === "sente" ? game.player2 : game.player1;
  res.json({
    state: game.stateJson,
    color,
    status: game.status,
    resultKind: game.resultKind,
    opponent: { nickname: opponent.nickname },
    lastMoveAt: game.lastMoveAt,
    canClaimTimeout:
      game.status === "PLAYING" &&
      (game.stateJson as unknown as GameState).currentPlayer !== color &&
      Date.now() - new Date(game.lastMoveAt).getTime() > TIMEOUT_MS,
  });
});

const moveSchema = z.object({ move: z.any() });

onlineRouter.post("/games/:id/move", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "VALIDATION_ERROR" });
    return;
  }
  const loaded = await loadAuthorizedGame(req.params.id, req.userId!);
  if ("error" in loaded) {
    res.status(loaded.error === "NOT_FOUND" ? 404 : 403).json({ error: loaded.error });
    return;
  }
  const { game, color } = loaded;
  if (game.status !== "PLAYING") {
    res.status(409).json({ error: "GAME_OVER" });
    return;
  }

  const before = game.stateJson as unknown as GameState;
  if (before.currentPlayer !== color) {
    res.status(400).json({ error: "NOT_YOUR_TURN" });
    return;
  }

  const move = parsed.data.move as Move;
  const after = gameReducer(before, { type: "MOVE", move });
  if (after === before) {
    res.status(400).json({ error: "ILLEGAL_MOVE" });
    return;
  }

  const gameOver = after.status !== "ongoing";
  await prisma.$transaction([
    prisma.gameMove.create({
      data: {
        gameId: game.id,
        moveNumber: after.history.length,
        playerId: req.userId!,
        moveData: JSON.stringify(after.history[after.history.length - 1]),
      },
    }),
    prisma.game.update({
      where: { id: game.id },
      data: {
        stateJson: after as unknown as object,
        lastMoveAt: new Date(),
        ...(gameOver
          ? {
              status: "FINISHED",
              winnerId: winnerIdOf(game, after),
              resultKind: after.status,
              endedAt: new Date(),
            }
          : {}),
      },
    }),
  ]);

  res.json({ state: after });
});

onlineRouter.post("/games/:id/resign", requireAuth, async (req: AuthedRequest, res) => {
  const loaded = await loadAuthorizedGame(req.params.id, req.userId!);
  if ("error" in loaded) {
    res.status(loaded.error === "NOT_FOUND" ? 404 : 403).json({ error: loaded.error });
    return;
  }
  const { game } = loaded;
  if (game.status !== "PLAYING") {
    res.status(409).json({ error: "GAME_OVER" });
    return;
  }
  const before = game.stateJson as unknown as GameState;
  const after = gameReducer(before, { type: "RESIGN" });

  await prisma.game.update({
    where: { id: game.id },
    data: {
      stateJson: after as unknown as object,
      status: "FINISHED",
      winnerId: winnerIdOf(game, after),
      resultKind: "resign",
      endedAt: new Date(),
    },
  });

  res.json({ state: after });
});

onlineRouter.post("/games/:id/claim-timeout", requireAuth, async (req: AuthedRequest, res) => {
  const loaded = await loadAuthorizedGame(req.params.id, req.userId!);
  if ("error" in loaded) {
    res.status(loaded.error === "NOT_FOUND" ? 404 : 403).json({ error: loaded.error });
    return;
  }
  const { game, color } = loaded;
  if (game.status !== "PLAYING") {
    res.status(409).json({ error: "GAME_OVER" });
    return;
  }
  const before = game.stateJson as unknown as GameState;
  if (before.currentPlayer === color) {
    res.status(400).json({ error: "CANNOT_CLAIM_OWN_TURN" });
    return;
  }
  if (Date.now() - new Date(game.lastMoveAt).getTime() <= TIMEOUT_MS) {
    res.status(400).json({ error: "TOO_SOON" });
    return;
  }

  const after = gameReducer(before, { type: "TIMEOUT" });

  await prisma.game.update({
    where: { id: game.id },
    data: {
      stateJson: after as unknown as object,
      status: "FINISHED",
      winnerId: winnerIdOf(game, after),
      resultKind: "timeout",
      endedAt: new Date(),
    },
  });

  res.json({ state: after });
});
