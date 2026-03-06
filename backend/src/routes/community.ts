import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { content, category, isAnonymous } = req.body;

    if (!content || !category) {
      return res.status(400).json({ error: "Content and category are required" });
    }

    const post = await prisma.communityPost.create({
      data: { userId, content, category, isAnonymous: isAnonymous ?? true },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { reactions: true } },
      },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error("Community post error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const category = req.query.category as string | undefined;

    const where: { category?: string } = {};
    if (category) where.category = category;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, image: true } },
          reactions: { select: { type: true, userId: true } },
          _count: { select: { reactions: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

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

      return {
        id: post.id,
        content: post.content,
        category: post.category,
        isAnonymous: post.isAnonymous,
        createdAt: post.createdAt,
        user: post.isAnonymous ? { name: "Anonymous", image: null } : post.user,
        reactions: Object.entries(reactionCounts).map(([type, data]) => ({
          type,
          _count: data.count,
          userReacted: data.userReacted,
        })),
        _count: post._count,
      };
    });

    return res.json({ posts: transformedPosts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get community posts error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/:postId/react", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const postId = req.params.postId as string;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Reaction type is required" });
    }

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: { userId_postId_type: { userId, postId, type } },
    });

    if (existingReaction) {
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      return res.json({ action: "removed", type });
    }

    await prisma.reaction.create({ data: { userId, postId, type } });
    return res.status(201).json({ action: "added", type });
  } catch (error) {
    console.error("Reaction error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
