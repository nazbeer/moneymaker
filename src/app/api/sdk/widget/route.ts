import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AFFIRMATIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const key = authHeader.slice(7);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            isPremium: true,
            name: true,
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const userId = apiKey.user.id;

    // Get recent mood data for widget display
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentMoods, streak] = await Promise.all([
      prisma.moodEntry.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 7,
        select: {
          mood: true,
          createdAt: true,
        },
      }),
      prisma.healingStreak.findUnique({
        where: { userId },
        select: {
          currentStreak: true,
        },
      }),
    ]);

    const randomAffirmation =
      AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

    return NextResponse.json({
      user: {
        name: apiKey.user.name,
        isPremium: apiKey.user.isPremium,
      },
      currentStreak: streak?.currentStreak || 0,
      recentMoods,
      affirmation: randomAffirmation,
      features: {
        chat: true,
        moodTracking: true,
        exercises: apiKey.user.isPremium,
      },
    });
  } catch (error) {
    console.error("SDK widget error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
