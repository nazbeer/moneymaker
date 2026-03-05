import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.slice(7);
  const apiKey = await prisma.apiKey.findUnique({
    where: { key, isActive: true },
    include: { user: { select: { id: true } } },
  });

  return apiKey;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = await authenticateApiKey(req);
    if (!apiKey) {
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

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        note: note || null,
        tags: tags || [],
      },
    });

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
    if (!apiKey) {
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
    console.error("SDK get moods error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
