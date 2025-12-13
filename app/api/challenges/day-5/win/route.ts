import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { eq, and, desc } from "drizzle-orm";

const CHALLENGE_DAY = 5;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenge = getChallengeByDay(CHALLENGE_DAY);
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Find the most recent unverified submission for this user and challenge
    const recentSubmission = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, session.userId),
          eq(submissions.challengeId, challenge.id),
          eq(submissions.isVerified, false)
        )
      )
      .orderBy(desc(submissions.createdAt))
      .limit(1);

    if (recentSubmission.length === 0) {
      return NextResponse.json(
        { error: "No pending game submission found. Generate a game first!" },
        { status: 400 }
      );
    }

    const submission = recentSubmission[0];

    // Update the submission to verified with full score
    await db
      .update(submissions)
      .set({
        isVerified: true,
        score: 100,
      })
      .where(eq(submissions.id, submission.id));

    return NextResponse.json({
      success: true,
      message: "🏆 Congratulations! You won the race and earned 100 points!",
      score: 100,
      isVerified: true,
    });
  } catch (error) {
    console.error("Win submission error:", error);
    return NextResponse.json(
      { error: "An error occurred while recording your win" },
      { status: 500 }
    );
  }
}

