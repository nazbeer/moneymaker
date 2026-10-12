import { Router, Response } from "express";
import crypto from "crypto";
import { prisma, withDates } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const apiKeys = await prisma.orm.public.ApiKey
      .where({ userId })
      .orderBy((row) => row.createdAt.desc())
      .select("id", "name", "key", "isActive", "createdAt")
      .all()
      .then(withDates);

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

    const apiKey = await prisma.orm.public.ApiKey
      .create({ userId, name, key })
      .then(withDates);

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

    const apiKey = await prisma.orm.public.ApiKey
      .where({ id: keyId, userId })
      .first()
      .then(withDates);

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    await prisma.orm.public.ApiKey
      .where({ id: keyId })
      .delete()
      .then((row) => { if (!row) throw new Error("Record not found for delete"); return row; })
      .then(withDates);
    return res.json({ message: "API key deleted" });
  } catch (error) {
    console.error("Delete API key error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
