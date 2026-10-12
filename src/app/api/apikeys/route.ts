import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withDates } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const apiKeys = await prisma.orm.public.ApiKey
      .where({ userId })
      .orderBy((row) => row.createdAt.desc())
      .select("id", "name", "key", "isActive", "createdAt")
      .all()
      .then(withDates);

    // Mask the keys, showing only the last 8 characters
    const maskedKeys = apiKeys.map((apiKey) => ({
      ...apiKey,
      key: `hm_...${apiKey.key.slice(-8)}`,
    }));

    return NextResponse.json(maskedKeys);
  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 }
      );
    }

    // Generate a unique API key
    const key = `hm_${crypto.randomUUID().replace(/-/g, "")}`;

    const apiKey = await prisma.orm.public.ApiKey
      .create({ userId, name, key })
      .then(withDates);

    // Return the full key only on creation
    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        createdAt: apiKey.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    const apiKey = await prisma.orm.public.ApiKey
      .where({ id: keyId, userId })
      .first()
      .then(withDates);

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    await prisma.orm.public.ApiKey
      .where({ id: keyId })
      .delete()
      .then((row) => { if (!row) throw new Error("Record not found for delete"); return row; })
      .then(withDates);

    return NextResponse.json({ message: "API key deleted" });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
