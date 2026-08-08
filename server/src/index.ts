import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { authRouter } from "./auth/routes.js";
import { contactRouter } from "./contact/routes.js";
import { noticeRouter } from "./notice/routes.js";
import { gamesRouter } from "./games/routes.js";
import { attachOnlineGameServer } from "./ws/onlineServer.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use("/api/notices", noticeRouter);
app.use("/api/games", gamesRouter);

// Centralized error handler so an unexpected throw returns JSON, not an HTML stack trace.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." });
});

const httpServer = http.createServer(app);
attachOnlineGameServer(httpServer);

const port = Number(process.env.PORT ?? 8787);
httpServer.listen(port, () => {
  console.log(`Shogi Dojo API + WS listening on http://localhost:${port}`);
});
