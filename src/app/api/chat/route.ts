import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, timestamp, withDates } from "@/lib/prisma";
import OpenAI from "openai";
import { SYSTEM_PROMPT, FREE_CHAT_LIMIT } from "@/lib/constants";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { message, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
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
        return NextResponse.json(
          {
            error: "Daily chat limit reached. Upgrade to Premium for unlimited chats.",
            limitReached: true,
          },
          { status: 429 }
        );
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
        return NextResponse.json(
          { error: "Chat session not found" },
          { status: 404 }
        );
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

    // Build message history for OpenAI
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

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content, sessionId: chatSession.id })}\n\n`)
              );
            }
          }

          // Save assistant message after streaming is done
          await prisma.orm.public.ChatMessage
            .create({ chatSessionId: chatSession.id, role: "assistant", content: fullResponse })
            .then(withDates);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: chatSession.id })}\n\n`)
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const chatSessions = await prisma.orm.public.ChatSession
      .where({ userId })
      .orderBy((row) => row.updatedAt.desc())
      .select("id", "title", "createdAt", "updatedAt")
      .include("messages", (related) => related.count())
      .all()
      .then((rows) => rows.map(({ messages, ...row }) => ({ ...row, _count: { messages } })))
      .then(withDates);

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error("Get chat sessions error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
