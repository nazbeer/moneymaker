import { Router, Response } from "express";
import OpenAI from "openai";
import { prisma, timestamp, withDates } from "../lib/prisma";
import { SYSTEM_PROMPT, AFFIRMATIONS } from "../lib/constants";
import { requireApiKey, AuthRequest } from "../middleware/auth";

const router = Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

router.post("/chat", requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let chatSession;
    if (sessionId) {
      chatSession = await prisma.orm.public.ChatSession
        .where({ id: sessionId, userId })
        .include("messages", (related) => related.orderBy((row) => row.createdAt.asc()))
        .first()
        .then(withDates);
      if (!chatSession) {
        return res.status(404).json({ error: "Chat session not found" });
      }
    } else {
      chatSession = await prisma.orm.public.ChatSession
        .include("messages")
        .create({ userId, title: message.slice(0, 50) })
        .then(withDates);
    }

    await prisma.orm.public.ChatMessage
      .create({ chatSessionId: chatSession.id, role: "user", content: message })
      .then(withDates);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatSession.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "";

    await prisma.orm.public.ChatMessage
      .create({ chatSessionId: chatSession.id, role: "assistant", content: assistantMessage })
      .then(withDates);

    return res.json({ sessionId: chatSession.id, message: assistantMessage });
  } catch (error) {
    console.error("SDK chat error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/mood", requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { mood, note, tags } = req.body;

    if (!mood || mood < 1 || mood > 5) {
      return res.status(400).json({ error: "Mood must be between 1 and 5" });
    }

    const moodEntry = await prisma.orm.public.MoodEntry
      .create({ userId, mood, note: note || null, tags: tags || [] })
      .then(withDates);

    return res.status(201).json(moodEntry);
  } catch (error) {
    console.error("SDK mood error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/mood", requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const days = parseInt((req.query.days as string) || "30");
    const since = new Date();
    since.setDate(since.getDate() - days);

    const moods = await prisma.orm.public.MoodEntry
      .where((row) => row.createdAt.gte(timestamp(since)))
      .where({ userId })
      .orderBy((row) => row.createdAt.desc())
      .select("id", "mood", "note", "tags", "createdAt")
      .all()
      .then(withDates);

    return res.json(moods);
  } catch (error) {
    console.error("SDK get moods error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/widget", requireApiKey, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentMoods, streak, user] = await Promise.all([
      prisma.orm.public.MoodEntry
        .where((row) => row.createdAt.gte(timestamp(sevenDaysAgo)))
        .where({ userId })
        .orderBy((row) => row.createdAt.desc())
        .limit(7)
        .select("mood", "createdAt")
        .all()
        .then(withDates),
      prisma.orm.public.HealingStreak
        .where({ userId })
        .select("currentStreak")
        .first()
        .then(withDates),
      prisma.orm.public.User
        .where({ id: userId })
        .select("name", "isPremium")
        .first()
        .then(withDates),
    ]);

    const randomAffirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

    return res.json({
      user: { name: user?.name, isPremium: user?.isPremium },
      currentStreak: streak?.currentStreak || 0,
      recentMoods,
      affirmation: randomAffirmation,
      features: { chat: true, moodTracking: true, exercises: user?.isPremium },
    });
  } catch (error) {
    console.error("SDK widget error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
