import { Router, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, key: true, isActive: true, createdAt: true },
    });

    const maskedKeys = apiKeys.map((apiKey) => ({
      ...apiKey,
      key: `hm_...${apiKey.key.slice(-8)}`,
    }));

    return res.json(maskedKeys);
  } catch (error) {
    console.error("Get API keys error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "API key name is required" });
    }

    const key = `hm_${crypto.randomUUID().replace(/-/g, "")}`;

    const apiKey = await prisma.apiKey.create({
      data: { userId, name, key },
    });

    return res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const keyId = req.query.id as string;

    if (!keyId) {
      return res.status(400).json({ error: "API key ID is required" });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });
    return res.json({ message: "API key deleted" });
  } catch (error) {
    console.error("Delete API key error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
