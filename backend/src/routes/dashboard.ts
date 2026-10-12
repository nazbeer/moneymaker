import { Router, Response } from "express";
import { prisma, timestamp, withDates } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalMoods, totalChats, totalJournals, streak, recentMoods] =
      await Promise.all([
        prisma.orm.public.MoodEntry
          .where({ userId })
          .aggregate((aggregate) => ({ count: aggregate.count() }))
          .then((result) => result.count),
        prisma.orm.public.ChatSession
          .where({ userId })
          .aggregate((aggregate) => ({ count: aggregate.count() }))
          .then((result) => result.count),
        prisma.orm.public.JournalEntry
          .where({ userId })
          .aggregate((aggregate) => ({ count: aggregate.count() }))
          .then((result) => result.count),
        prisma.orm.public.HealingStreak
          .where({ userId })
          .first()
          .then(withDates),
        prisma.orm.public.MoodEntry
          .where((row) => row.createdAt.gte(timestamp(thirtyDaysAgo)))
          .where({ userId })
          .orderBy((row) => row.createdAt.asc())
          .select("id", "mood", "note", "tags", "createdAt")
          .all()
          .then(withDates),
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
