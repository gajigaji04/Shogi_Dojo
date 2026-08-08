import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(100),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  subject: z.string().min(1, "제목을 입력해주세요.").max(200),
  message: z.string().min(1, "내용을 입력해주세요.").max(5000),
});

contactRouter.post("/", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", fieldErrors: parsed.error.flatten().fieldErrors });
    return;
  }
  const contact = await prisma.contact.create({ data: parsed.data });
  res.status(201).json({ success: true, id: contact.id });
});
