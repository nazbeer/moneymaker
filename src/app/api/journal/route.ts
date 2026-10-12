import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withDates } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { prompt, content, category } = await req.json();

    if (!content || !prompt) {
      return NextResponse.json(
        { error: "Prompt and content are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.orm.public.JournalEntry
      .create({ userId, prompt, content, category: category || "reflection" })
      .then(withDates);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Journal create error:", error);
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");

    const where: { userId: string; category?: string } = { userId };
    if (category) {
      where.category = category;
    }

    const [entries, total] = await Promise.all([
      prisma.orm.public.JournalEntry
        .where(where)
        .orderBy((row) => row.createdAt.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .select("id", "prompt", "content", "category", "createdAt")
        .all()
        .then(withDates),
      prisma.orm.public.JournalEntry
        .where(where)
        .aggregate((aggregate) => ({ count: aggregate.count() }))
        .then((result) => result.count),
    ]);

    return NextResponse.json({
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get journals error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
