import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { HEALING_EXERCISES } from "../lib/constants";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const category = req.query.category as string | undefined;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    let exercises = HEALING_EXERCISES;
    if (category) {
      exercises = exercises.filter((e) => e.category === category);
    }

    const result = exercises.map((exercise) => ({
      ...exercise,
      isLocked: exercise.isPremium && !user?.isPremium,
    }));

    return res.json(result);
  } catch (error) {
    console.error("Get exercises error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
