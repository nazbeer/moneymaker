import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HEALING_EXERCISES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    let exercises = HEALING_EXERCISES;

    if (category) {
      exercises = exercises.filter((e) => e.category === category);
    }

    // Mark premium exercises as locked for free users
    const result = exercises.map((exercise) => ({
      ...exercise,
      isLocked: exercise.isPremium && !user?.isPremium,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get exercises error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
