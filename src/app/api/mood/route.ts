import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, timestamp, withDates } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { mood, note, tags } = await req.json();

    if (!mood || mood < 1 || mood > 5) {
      return NextResponse.json(
        { error: "Mood must be between 1 and 5" },
        { status: 400 }
      );
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
        // Same day, just update lastActiveDate
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

    return NextResponse.json(moodEntry, { status: 201 });
  } catch (error) {
    console.error("Mood log error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const moods = await prisma.orm.public.MoodEntry
      .where((row) => row.createdAt.gte(timestamp(since)))
      .where({ userId })
      .orderBy((row) => row.createdAt.desc())
      .select("id", "mood", "note", "tags", "createdAt")
      .all()
      .then(withDates);

    return NextResponse.json(moods);
  } catch (error) {
    console.error("Get moods error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
