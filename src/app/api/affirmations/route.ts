import { NextResponse } from "next/server";
import { AFFIRMATIONS } from "@/lib/constants";

export async function GET() {
  try {
    const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
    const affirmation = AFFIRMATIONS[randomIndex];

    return NextResponse.json({ affirmation });
  } catch (error) {
    console.error("Affirmation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
