import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { prompt, content, category } = req.body;

    if (!content || !prompt) {
      return res.status(400).json({ error: "Prompt and content are required" });
    }

    const entry = await prisma.journalEntry.create({
      data: { userId, prompt, content, category: category || "reflection" },
    });

    return res.status(201).json(entry);
  } catch (error) {
    console.error("Journal create error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const category = req.query.category as string | undefined;

    const where: { userId: string; category?: string } = { userId };
    if (category) where.category = category;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, prompt: true, content: true, category: true, createdAt: true },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return res.json({ entries, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get journals error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
