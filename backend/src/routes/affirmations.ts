import { Router, Request, Response } from "express";
import { AFFIRMATIONS } from "../lib/constants";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
  return res.json({ affirmation: AFFIRMATIONS[randomIndex] });
});

export default router;
