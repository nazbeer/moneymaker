import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalMoods, totalChats, totalJournals, streak, recentMoods] =
      await Promise.all([
        prisma.moodEntry.count({ where: { userId } }),
        prisma.chatSession.count({ where: { userId } }),
        prisma.journalEntry.count({ where: { userId } }),
        prisma.healingStreak.findUnique({ where: { userId } }),
        prisma.moodEntry.findMany({
          where: { userId, createdAt: { gte: thirtyDaysAgo } },
          orderBy: { createdAt: "asc" },
          select: { id: true, mood: true, note: true, tags: true, createdAt: true },
        }),
      ]);

    const avgMood =
      recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length
        : 0;

    return res.json({
      totalMoods,
      totalChats,
      totalJournals,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      avgMood: Math.round(avgMood * 10) / 10,
      moodTrend: recentMoods,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
