import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const streak = await prisma.healingStreak.findUnique({
      where: { userId },
    });

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
          data: {
            currentStreak: 1,
            lastActiveDate: new Date(),
          },
        });
      } else {
        // Same day, just update lastActiveDate
        await prisma.healingStreak.update({
          where: { userId },
          data: { lastActiveDate: new Date() },
        });
      }
    } else {
      await prisma.healingStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date(),
        },
      });
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

    const moods = await prisma.moodEntry.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        mood: true,
        note: true,
        tags: true,
        createdAt: true,
      },
    });

    return NextResponse.json(moods);
  } catch (error) {
    console.error("Get moods error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
