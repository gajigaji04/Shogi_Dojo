import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "../auth/jwt.js";
import { prisma } from "../db.js";
import { gameReducer } from "../../../src/game/state/gameReducer.js";
import { createInitialGameState } from "../../../src/game/state/gameState.js";
import type { GameState, Move, Player } from "../../../src/game/types/shogi.js";

interface ClientInfo {
  userId: string;
  nickname: string;
}

interface Room {
  id: string;
  dbGameId: string;
  sockets: Record<Player, WebSocket>;
  userIds: Record<Player, string>;
  nicknames: Record<Player, string>;
  state: GameState;
}

const clients = new Map<WebSocket, ClientInfo>();
const socketRoom = new Map<WebSocket, { roomId: string; color: Player }>();
const rooms = new Map<string, Room>();
let waiting: { ws: WebSocket } | null = null;

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function otherColor(color: Player): Player {
  return color === "sente" ? "gote" : "sente";
}

async function finalizeGame(room: Room, resultKind: "checkmate" | "resign" | "disconnect") {
  const winnerColor = room.state.winner;
  const winnerId = winnerColor ? room.userIds[winnerColor] : null;
  await prisma.game
    .update({
      where: { id: room.dbGameId },
      data: { status: "FINISHED", winnerId, resultKind, endedAt: new Date() },
    })
    .catch(() => {});
}

async function persistMove(room: Room, playerId: string) {
  const entry = room.state.history[room.state.history.length - 1];
  if (!entry) return;
  await prisma.gameMove
    .create({
      data: {
        gameId: room.dbGameId,
        moveNumber: room.state.history.length,
        playerId,
        moveData: JSON.stringify(entry),
      },
    })
    .catch(() => {});
}

function removeRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  socketRoom.delete(room.sockets.sente);
  socketRoom.delete(room.sockets.gote);
  rooms.delete(roomId);
}

async function handleDisconnect(ws: WebSocket) {
  if (waiting?.ws === ws) waiting = null;

  const membership = socketRoom.get(ws);
  if (membership) {
    const room = rooms.get(membership.roomId);
    if (room) {
      const opponentColor = otherColor(membership.color);
      const opponentSocket = room.sockets[opponentColor];
      if (room.state.status === "ongoing") {
        room.state = { ...room.state, status: "resigned", winner: opponentColor };
        await finalizeGame(room, "disconnect");
      }
      send(opponentSocket, { type: "opponent_disconnected" });
      send(opponentSocket, {
        type: "game_over",
        status: room.state.status,
        winner: room.state.winner,
        resultKind: "disconnect",
      });
      removeRoom(room.id);
    }
  }

  clients.delete(ws);
}

async function startMatch(a: WebSocket, b: WebSocket) {
  const infoA = clients.get(a)!;
  const infoB = clients.get(b)!;

  const dbGame = await prisma.game.create({
    data: { player1Id: infoA.userId, player2Id: infoB.userId, status: "PLAYING" },
  });

  const roomId = dbGame.id;
  const room: Room = {
    id: roomId,
    dbGameId: dbGame.id,
    sockets: { sente: a, gote: b },
    userIds: { sente: infoA.userId, gote: infoB.userId },
    nicknames: { sente: infoA.nickname, gote: infoB.nickname },
    state: createInitialGameState(),
  };
  rooms.set(roomId, room);
  socketRoom.set(a, { roomId, color: "sente" });
  socketRoom.set(b, { roomId, color: "gote" });

  send(a, { type: "matched", roomId, color: "sente", opponent: { nickname: infoB.nickname }, state: room.state });
  send(b, { type: "matched", roomId, color: "gote", opponent: { nickname: infoA.nickname }, state: room.state });
}

async function handleMessage(ws: WebSocket, raw: string) {
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(ws, { type: "error", message: "잘못된 메시지 형식입니다." });
    return;
  }

  const info = clients.get(ws);
  if (!info) return;

  if (msg.type === "join_queue") {
    if (waiting && waiting.ws !== ws) {
      const opponent = waiting.ws;
      waiting = null;
      await startMatch(opponent, ws);
      return;
    }
    if (!waiting) {
      waiting = { ws };
      send(ws, { type: "queued" });
    }
    return;
  }

  if (msg.type === "leave_queue") {
    if (waiting?.ws === ws) waiting = null;
    return;
  }

  const membership = socketRoom.get(ws);
  if (!membership) {
    send(ws, { type: "error", message: "대국방에 참가하고 있지 않습니다." });
    return;
  }
  const room = rooms.get(membership.roomId);
  if (!room) return;

  if (msg.type === "move") {
    if (room.state.status !== "ongoing") return;
    if (room.state.currentPlayer !== membership.color) {
      send(ws, { type: "move_rejected", reason: "TURN" });
      return;
    }
    const move = msg.move as Move;
    const before = room.state;
    const after = gameReducer(before, { type: "MOVE", move });
    if (after === before) {
      send(ws, { type: "move_rejected", reason: "ILLEGAL" });
      return;
    }
    room.state = after;
    await persistMove(room, info.userId);
    send(room.sockets.sente, { type: "state", state: after });
    send(room.sockets.gote, { type: "state", state: after });
    if (after.status !== "ongoing") {
      await finalizeGame(room, "checkmate");
      send(room.sockets.sente, { type: "game_over", status: after.status, winner: after.winner, resultKind: "checkmate" });
      send(room.sockets.gote, { type: "game_over", status: after.status, winner: after.winner, resultKind: "checkmate" });
      removeRoom(room.id);
    }
    return;
  }

  if (msg.type === "resign") {
    if (room.state.status !== "ongoing") return;
    const after = gameReducer(room.state, { type: "RESIGN" });
    room.state = after;
    await finalizeGame(room, "resign");
    send(room.sockets.sente, { type: "state", state: after });
    send(room.sockets.gote, { type: "state", state: after });
    send(room.sockets.sente, { type: "game_over", status: after.status, winner: after.winner, resultKind: "resign" });
    send(room.sockets.gote, { type: "game_over", status: after.status, winner: after.winner, resultKind: "resign" });
    removeRoom(room.id);
    return;
  }
}

export function attachOnlineGameServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      ws.close(4001, "unauthorized");
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      ws.close(4001, "unauthorized");
      return;
    }
    clients.set(ws, { userId: user.id, nickname: user.nickname });

    ws.on("message", (data) => {
      handleMessage(ws, data.toString()).catch((err) => {
        console.error("ws message error", err);
      });
    });
    ws.on("close", () => {
      handleDisconnect(ws).catch((err) => console.error("ws close error", err));
    });
  });

  return wss;
}
