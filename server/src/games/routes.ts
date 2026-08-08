import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import type { AuthedRequest } from "../auth/middleware.js";

export const gamesRouter = Router();

gamesRouter.get("/mine", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const games = await prisma.game.findMany({
    where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
    orderBy: { createdAt: "desc" },
    include: { player1: true, player2: true, winner: true },
    take: 50,
  });
  res.json({
    games: games.map((g) => ({
      id: g.id,
      status: g.status,
      resultKind: g.resultKind,
      startedAt: g.startedAt,
      endedAt: g.endedAt,
      opponent: g.player1Id === userId ? g.player2.nickname : g.player1.nickname,
      humanPlayer: g.player1Id === userId ? "sente" : "gote",
      winner:
        g.winnerId === null ? null : g.winnerId === g.player1Id ? "sente" : g.winnerId === g.player2Id ? "gote" : null,
    })),
  });
});

// Only participants of a game may fetch its full move data — prevents enumerating
// other players' games by guessing IDs.
gamesRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const game = await prisma.game.findUnique({
    where: { id: req.params.id },
    include: { player1: true, player2: true, winner: true, moves: { orderBy: { moveNumber: "asc" } } },
  });
  if (!game) {
    res.status(404).json({ error: "NOT_FOUND", message: "대국을 찾을 수 없습니다." });
    return;
  }
  if (game.player1Id !== userId && game.player2Id !== userId) {
    res.status(403).json({ error: "FORBIDDEN", message: "이 대국을 열람할 권한이 없습니다." });
    return;
  }
  res.json({
    game: {
      id: game.id,
      status: game.status,
      resultKind: game.resultKind,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      humanPlayer: game.player1Id === userId ? "sente" : "gote",
      opponent: game.player1Id === userId ? game.player2.nickname : game.player1.nickname,
      winner:
        game.winnerId === null
          ? null
          : game.winnerId === game.player1Id
            ? "sente"
            : game.winnerId === game.player2Id
              ? "gote"
              : null,
      history: game.moves.map((m) => JSON.parse(m.moveData)),
    },
  });
});
