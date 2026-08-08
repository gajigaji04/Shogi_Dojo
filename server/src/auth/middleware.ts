import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "AUTH_REQUIRED", message: "로그인이 필요합니다." });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "INVALID_TOKEN", message: "인증이 만료되었습니다. 다시 로그인해주세요." });
    return;
  }
  req.userId = payload.userId;
  next();
}

/** Like requireAuth, but never rejects — just attaches userId if a valid token is present. */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.userId = payload.userId;
  }
  next();
}
