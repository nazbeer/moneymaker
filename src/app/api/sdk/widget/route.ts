import { NextRequest, NextResponse } from "next/server";
import { prisma, timestamp, withDates } from "@/lib/prisma";
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
    const apiKey = await prisma.orm.public.ApiKey
      .where({ key, isActive: true })
      .include("user", (related) => related.select("id", "isPremium", "name"))
      .first()
      .then(withDates);

    if (!apiKey?.user) {
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
      prisma.orm.public.MoodEntry
        .where((row) => row.createdAt.gte(timestamp(sevenDaysAgo)))
        .where({ userId })
        .orderBy((row) => row.createdAt.desc())
        .limit(7)
        .select("mood", "createdAt")
        .all()
        .then(withDates),
      prisma.orm.public.HealingStreak
        .where({ userId })
        .select("currentStreak")
        .first()
        .then(withDates),
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
