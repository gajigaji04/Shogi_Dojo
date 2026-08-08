import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "./hash.js";
import { signToken } from "./jwt.js";
import { requireAuth } from "./middleware.js";
import type { AuthedRequest } from "./middleware.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다.").max(20, "닉네임은 20자 이하여야 합니다."),
});

function publicUser(user: { id: string; email: string; nickname: string }) {
  return { id: user.id, email: user.email, nickname: user.nickname };
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", fieldErrors: parsed.error.flatten().fieldErrors });
    return;
  }
  const { email, password, nickname } = parsed.data;

  const [existingEmail, existingNickname] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { nickname } }),
  ]);
  if (existingEmail) {
    res.status(409).json({ error: "EMAIL_TAKEN", message: "이미 사용 중인 이메일입니다." });
    return;
  }
  if (existingNickname) {
    res.status(409).json({ error: "NICKNAME_TAKEN", message: "이미 사용 중인 닉네임입니다." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, nickname, passwordHash } });
  const token = signToken({ userId: user.id });
  res.status(201).json({ token, user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "이메일과 비밀번호를 입력해주세요." });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  const token = signToken({ userId: user.id });
  res.json({ token, user: publicUser(user) });
});

// Stateless JWT — logout is a client-side token discard. This endpoint exists so the
// frontend has a symmetric, explicit action to call (and a hook point for a future
// token-blocklist if sessions need server-side revocation).
authRouter.post("/logout", (_req, res) => {
  res.json({ success: true });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(404).json({ error: "USER_NOT_FOUND" });
    return;
  }
  res.json({ user: publicUser(user) });
});
