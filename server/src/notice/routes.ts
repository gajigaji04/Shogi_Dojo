import { Router } from "express";
import { prisma } from "../db.js";

export const noticeRouter = Router();

noticeRouter.get("/", async (_req, res) => {
  const notices = await prisma.notice.findMany({ orderBy: { publishedAt: "desc" } });
  res.json({ notices });
});

noticeRouter.get("/:id", async (req, res) => {
  const notice = await prisma.notice.findUnique({ where: { id: req.params.id } });
  if (!notice) {
    res.status(404).json({ error: "NOT_FOUND", message: "공지사항을 찾을 수 없습니다." });
    return;
  }
  res.json({ notice });
});
