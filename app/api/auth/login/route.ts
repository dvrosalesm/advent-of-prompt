import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and Name are required" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({ email, name })
        .returning();
      user = newUser;
    }

    await createSession(user.id, user.email, user.name || "");

    return NextResponse.json({ success: true, redirectTo: "/" });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

