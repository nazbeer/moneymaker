import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withDates } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { postId } = await params;
    const { type } = await req.json();

    if (!type) {
      return NextResponse.json(
        { error: "Reaction type is required" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.orm.public.CommunityPost
      .where({ id: postId })
      .first()
      .then(withDates);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle reaction: remove if exists, create if not
    const existingReaction = await prisma.orm.public.Reaction
      .where({ userId, postId, type })
      .first()
      .then(withDates);

    if (existingReaction) {
      await prisma.orm.public.Reaction
        .where({ id: existingReaction.id })
        .delete()
        .then((row) => { if (!row) throw new Error("Record not found for delete"); return row; })
        .then(withDates);
      return NextResponse.json({ action: "removed", type });
    }

    await prisma.orm.public.Reaction
      .create({ userId, postId, type })
      .then(withDates);

    return NextResponse.json({ action: "added", type }, { status: 201 });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
