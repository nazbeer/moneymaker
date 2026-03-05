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
    const { content, category, isAnonymous } = await req.json();

    if (!content || !category) {
      return NextResponse.json(
        { error: "Content and category are required" },
        { status: 400 }
      );
    }

    const post = await prisma.communityPost.create({
      data: {
        userId,
        content,
        category,
        isAnonymous: isAnonymous ?? true,
      },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { reactions: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Community post error:", error);
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

    const where: { category?: string } = {};
    if (category) {
      where.category = category;
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, image: true } },
          reactions: {
            select: { type: true, userId: true },
          },
          _count: { select: { reactions: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    // Transform posts to include aggregated reactions and whether current user reacted
    const transformedPosts = posts.map((post) => {
      const reactionCounts: Record<string, { count: number; userReacted: boolean }> = {};

      for (const reaction of post.reactions) {
        if (!reactionCounts[reaction.type]) {
          reactionCounts[reaction.type] = { count: 0, userReacted: false };
        }
        reactionCounts[reaction.type].count++;
        if (reaction.userId === userId) {
          reactionCounts[reaction.type].userReacted = true;
        }
      }

      const reactions = Object.entries(reactionCounts).map(([type, data]) => ({
        type,
        _count: data.count,
        userReacted: data.userReacted,
      }));

      return {
        id: post.id,
        content: post.content,
        category: post.category,
        isAnonymous: post.isAnonymous,
        createdAt: post.createdAt,
        user: post.isAnonymous
          ? { name: "Anonymous", image: null }
          : post.user,
        reactions,
        _count: post._count,
      };
    });

    return NextResponse.json({
      posts: transformedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get community posts error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
