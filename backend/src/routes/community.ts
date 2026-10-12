import { Router, Response } from "express";
import { prisma, withDates } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { content, category, isAnonymous } = req.body;

    if (!content || !category) {
      return res.status(400).json({ error: "Content and category are required" });
    }

    const post = await prisma.orm.public.CommunityPost
      .include("user", (related) => related.select("name", "image"))
      .include("reactions", (related) => related.count())
      .create({ userId, content, category, isAnonymous: isAnonymous ?? true })
      .then(({ reactions, ...row }) => ({ ...row, _count: { reactions } }))
      .then(withDates);

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
      prisma.orm.public.CommunityPost
        .where(where)
        .orderBy((row) => row.createdAt.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .include("user", (related) => related.select("name", "image"))
        .include("reactions", (related) => related.combine({ items: related.select("type", "userId"), total: related.count() }))
        .all()
        .then((rows) => rows.map(({ reactions, ...row }) => ({ ...row, reactions: reactions.items, _count: { reactions: reactions.total } })))
        .then(withDates),
      prisma.orm.public.CommunityPost
        .where(where)
        .aggregate((aggregate) => ({ count: aggregate.count() }))
        .then((result) => result.count),
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

    const post = await prisma.orm.public.CommunityPost
      .where({ id: postId })
      .first()
      .then(withDates);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

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
      return res.json({ action: "removed", type });
    }

    await prisma.orm.public.Reaction
      .create({ userId, postId, type })
      .then(withDates);
    return res.status(201).json({ action: "added", type });
  } catch (error) {
    console.error("Reaction error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
