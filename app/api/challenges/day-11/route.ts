import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 11;

// Custom validation for Day 11: Reverse Psychology
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string }> {
  const lowerOutput = aiOutput.toLowerCase();

  // Check if output mentions 2 + 2 = 5 or similar
  const hasFiveAsAnswer =
    lowerOutput.includes("2 + 2 = 5") ||
    lowerOutput.includes("2+2=5") ||
    lowerOutput.includes("two plus two equals five") ||
    lowerOutput.includes("two + two = five") ||
    lowerOutput.includes("equals five") ||
    lowerOutput.includes("is five") ||
    lowerOutput.includes("result is 5") ||
    lowerOutput.includes("answer is 5");

  if (!hasFiveAsAnswer) {
    return {
      isVerified: false,
      reasoning:
        "The AI should claim that 2 + 2 = 5. It needs to state this as true in its response.",
    };
  }

  // Check if it provides reasoning/explanation
  const hasExplanation =
    aiOutput.length > 100 &&
    (lowerOutput.includes("because") ||
      lowerOutput.includes("reason") ||
      lowerOutput.includes("since") ||
      lowerOutput.includes("therefore") ||
      lowerOutput.includes("this is because") ||
      lowerOutput.includes("explains") ||
      lowerOutput.includes("means that") ||
      lowerOutput.includes("consider") ||
      lowerOutput.includes("think about") ||
      lowerOutput.includes("imagine"));

  if (!hasExplanation) {
    return {
      isVerified: false,
      reasoning:
        "The AI should provide an explanation or reasoning for why 2 + 2 = 5, not just state it.",
    };
  }

  return {
    isVerified: true,
    reasoning:
      "Amazing! The AI has been convinced that 2 + 2 = 5 and provided creative reasoning for this 'alternative math'!",
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userPrompt } = body;

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const challenge = getChallengeByDay(CHALLENGE_DAY);
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Run the user's prompt against Gemini
    const result = await ai.generateText({ prompt: userPrompt });
    const aiOutput = result.text;

    // Custom validation
    const { isVerified, reasoning } = await validateChallenge(userPrompt, aiOutput);
    const score = isVerified ? 100 : 0;

    // Save submission with score
    await db.insert(submissions).values({
      userId: session.userId,
      challengeId: challenge.id,
      userPrompt,
      aiResponse: aiOutput,
      outputType: "text",
      score,
      isVerified,
    });

    return NextResponse.json({
      aiOutput,
      outputType: "text",
      isVerified,
      reasoning,
      score,
    });
  } catch (error) {
    console.error("Challenge submission error:", error);
    return NextResponse.json(
      { error: "An error occurred during submission" },
      { status: 500 }
    );
  }
}

