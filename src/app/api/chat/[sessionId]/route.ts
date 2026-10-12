import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withDates } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { sessionId } = await params;

    const chatSession = await prisma.orm.public.ChatSession
      .where({ id: sessionId, userId })
      .include("messages", (related) => related.orderBy((row) => row.createdAt.asc()).select("id", "role", "content", "createdAt"))
      .first()
      .then(withDates);

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error("Get chat session error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { sessionId } = await params;

    const chatSession = await prisma.orm.public.ChatSession
      .where({ id: sessionId, userId })
      .first()
      .then(withDates);

    if (!chatSession) {
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 }
      );
    }

    await prisma.orm.public.ChatSession
      .where({ id: sessionId })
      .delete()
      .then((row) => { if (!row) throw new Error("Record not found for delete"); return row; })
      .then(withDates);

    return NextResponse.json({ message: "Chat session deleted" });
  } catch (error) {
    console.error("Delete chat session error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
