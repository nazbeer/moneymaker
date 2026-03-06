import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  isPremium?: boolean;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }

  const key = authHeader.slice(7);

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key, isActive: true },
      include: { user: { select: { id: true, isPremium: true, name: true } } },
    });

    if (!apiKey) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }

    req.userId = apiKey.user.id;
    req.isPremium = apiKey.user.isPremium;
    next();
  } catch {
    return res.status(401).json({ error: "Authentication failed" });
  }
}
