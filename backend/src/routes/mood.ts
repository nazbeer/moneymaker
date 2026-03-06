import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { mood, note, tags } = req.body;

    if (!mood || mood < 1 || mood > 5) {
      return res.status(400).json({ error: "Mood must be between 1 and 5" });
    }

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        note: note || null,
        tags: tags || [],
      },
    });

    // Update healing streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await prisma.healingStreak.findUnique({ where: { userId } });

    if (streak) {
      const lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        const newStreak = streak.currentStreak + 1;
        await prisma.healingStreak.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastActiveDate: new Date(),
          },
        });
      } else if (diffDays > 1) {
        await prisma.healingStreak.update({
          where: { userId },
          data: { currentStreak: 1, lastActiveDate: new Date() },
        });
      } else {
        await prisma.healingStreak.update({
          where: { userId },
          data: { lastActiveDate: new Date() },
        });
      }
    } else {
      await prisma.healingStreak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: new Date() },
      });
    }

    return res.status(201).json(moodEntry);
  } catch (error) {
    console.error("Mood log error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const days = parseInt((req.query.days as string) || "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const moods = await prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, mood: true, note: true, tags: true, createdAt: true },
    });

    return res.json(moods);
  } catch (error) {
    console.error("Get moods error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
