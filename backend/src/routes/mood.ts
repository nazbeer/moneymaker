import { Router, Response } from "express";
import { prisma, timestamp, withDates } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { mood, note, tags } = req.body;

    if (!mood || mood < 1 || mood > 5) {
      return res.status(400).json({ error: "Mood must be between 1 and 5" });
    }

    const moodEntry = await prisma.orm.public.MoodEntry
      .create({ userId, mood, note: note || null, tags: tags || [] })
      .then(withDates);

    // Update healing streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await prisma.orm.public.HealingStreak
      .where({ userId })
      .first()
      .then(withDates);

    if (streak) {
      const lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        const newStreak = streak.currentStreak + 1;
        await prisma.orm.public.HealingStreak
          .where({ userId })
          .update({ currentStreak: newStreak, longestStreak: Math.max(newStreak, streak.longestStreak), lastActiveDate: timestamp(new Date()) })
          .then((row) => { if (!row) throw new Error("Record not found for update"); return row; })
          .then(withDates);
      } else if (diffDays > 1) {
        await prisma.orm.public.HealingStreak
          .where({ userId })
          .update({ currentStreak: 1, lastActiveDate: timestamp(new Date()) })
          .then((row) => { if (!row) throw new Error("Record not found for update"); return row; })
          .then(withDates);
      } else {
        await prisma.orm.public.HealingStreak
          .where({ userId })
          .update({ lastActiveDate: timestamp(new Date()) })
          .then((row) => { if (!row) throw new Error("Record not found for update"); return row; })
          .then(withDates);
      }
    } else {
      await prisma.orm.public.HealingStreak
        .create({ userId, currentStreak: 1, longestStreak: 1, lastActiveDate: timestamp(new Date()) })
        .then(withDates);
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

    const moods = await prisma.orm.public.MoodEntry
      .where((row) => row.createdAt.gte(timestamp(since)))
      .where({ userId })
      .orderBy((row) => row.createdAt.desc())
      .select("id", "mood", "note", "tags", "createdAt")
      .all()
      .then(withDates);

    return res.json(moods);
  } catch (error) {
    console.error("Get moods error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
