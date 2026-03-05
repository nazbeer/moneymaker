import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/constants";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.slice(7);
  const apiKey = await prisma.apiKey.findUnique({
    where: { key, isActive: true },
    include: { user: { select: { id: true, isPremium: true } } },
  });

  return apiKey;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = await authenticateApiKey(req);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const { message, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const userId = apiKey.user.id;

    // Get or create chat session
    let chatSession;
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: "Chat session not found" },
          { status: 404 }
        );
      }
    } else {
      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          title: message.slice(0, 50),
        },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        role: "user",
        content: message,
      },
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

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "";

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        role: "assistant",
        content: assistantMessage,
      },
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("SDK chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
