import { Router, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user?.isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayChats = await prisma.chatSession.count({
        where: { userId, createdAt: { gte: today } },
      });
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
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!chatSession) {
        return res.status(404).json({ error: "Chat session not found" });
      }
    } else {
      chatSession = await prisma.chatSession.create({
        data: { userId, title: message.slice(0, 50) },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { chatSessionId: chatSession.id, role: "user", content: message },
    });

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
    await prisma.chatMessage.create({
      data: { chatSessionId: chatSession.id, role: "assistant", content: fullResponse },
    });

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
    const chatSessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
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

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

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

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
    });

    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    await prisma.chatSession.delete({ where: { id: sessionId } });
    return res.json({ message: "Chat session deleted" });
  } catch (error) {
    console.error("Delete chat session error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
