import { db } from "@/lib/db";
import { votes } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.submissionId, submissionId),
        eq(votes.userId, session.userId)
      ),
    });

    let action: "added" | "removed";

    if (existingVote) {
      await db.delete(votes).where(eq(votes.id, existingVote.id));
      action = "removed";
    } else {
      await db.insert(votes).values({
        userId: session.userId,
        submissionId,
      });
      action = "added";
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Vote toggle error:", error);
    return NextResponse.json(
      { error: "An error occurred while toggling vote" },
      { status: 500 }
    );
  }
}

