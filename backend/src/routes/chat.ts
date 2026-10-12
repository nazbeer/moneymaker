import { Router, Response } from "express";
import OpenAI from "openai";
import { prisma, timestamp, withDates } from "../lib/prisma";
import { SYSTEM_PROMPT, FREE_CHAT_LIMIT } from "../lib/constants";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check chat limits for free users
    const user = await prisma.orm.public.User
      .where({ id: userId })
      .select("isPremium")
      .first()
      .then(withDates);

    if (!user?.isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayChats = await prisma.orm.public.ChatSession
        .where((row) => row.createdAt.gte(timestamp(today)))
        .where({ userId })
        .aggregate((aggregate) => ({ count: aggregate.count() }))
        .then((result) => result.count);
      if (!sessionId && todayChats >= FREE_CHAT_LIMIT) {
        return res.status(429).json({
          error: "Daily chat limit reached. Upgrade to Premium for unlimited chats.",
          limitReached: true,
        });
      }
    }

    // Get or create chat session
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

    // Save user message
    await prisma.orm.public.ChatMessage
      .create({ chatSessionId: chatSession.id, role: "user", content: message })
      .then(withDates);

    // Build message history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatSession.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Stream response
    const stream = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content, sessionId: chatSession.id })}\n\n`);
      }
    }

    // Save assistant message
    await prisma.orm.public.ChatMessage
      .create({ chatSessionId: chatSession.id, role: "assistant", content: fullResponse })
      .then(withDates);

    res.write(`data: ${JSON.stringify({ done: true, sessionId: chatSession.id })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const chatSessions = await prisma.orm.public.ChatSession
      .where({ userId })
      .orderBy((row) => row.updatedAt.desc())
      .select("id", "title", "createdAt", "updatedAt")
      .include("messages", (related) => related.count())
      .all()
      .then((rows) => rows.map(({ messages, ...row }) => ({ ...row, _count: { messages } })))
      .then(withDates);
    return res.json(chatSessions);
  } catch (error) {
    console.error("Get chat sessions error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/:sessionId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sessionId = req.params.sessionId as string;

    const chatSession = await prisma.orm.public.ChatSession
      .where({ id: sessionId, userId })
      .include("messages", (related) => related.orderBy((row) => row.createdAt.asc()).select("id", "role", "content", "createdAt"))
      .first()
      .then(withDates);

    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    return res.json(chatSession);
  } catch (error) {
    console.error("Get chat session error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:sessionId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sessionId = req.params.sessionId as string;

    const chatSession = await prisma.orm.public.ChatSession
      .where({ id: sessionId, userId })
      .first()
      .then(withDates);

    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    await prisma.orm.public.ChatSession
      .where({ id: sessionId })
      .delete()
      .then((row) => { if (!row) throw new Error("Record not found for delete"); return row; })
      .then(withDates);
    return res.json({ message: "Chat session deleted" });
  } catch (error) {
    console.error("Delete chat session error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
