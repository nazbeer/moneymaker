import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalMoods, totalChats, totalJournals, streak, recentMoods] =
      await Promise.all([
        prisma.moodEntry.count({ where: { userId } }),
        prisma.chatSession.count({ where: { userId } }),
        prisma.journalEntry.count({ where: { userId } }),
        prisma.healingStreak.findUnique({ where: { userId } }),
        prisma.moodEntry.findMany({
          where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            mood: true,
            note: true,
            tags: true,
            createdAt: true,
          },
        }),
      ]);

    const avgMood =
      recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length
        : 0;

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
