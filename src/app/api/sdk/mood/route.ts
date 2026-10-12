import { NextRequest, NextResponse } from "next/server";
import { prisma, timestamp, withDates } from "@/lib/prisma";

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.slice(7);
  const apiKey = await prisma.orm.public.ApiKey
    .where({ key, isActive: true })
    .include("user", (related) => related.select("id"))
    .first()
    .then(withDates);

  return apiKey;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = await authenticateApiKey(req);
    if (!apiKey?.user) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const userId = apiKey.user.id;
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

    return NextResponse.json(moodEntry, { status: 201 });
  } catch (error) {
    console.error("SDK mood error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = await authenticateApiKey(req);
    if (!apiKey?.user) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const userId = apiKey.user.id;
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
    console.error("SDK get moods error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
