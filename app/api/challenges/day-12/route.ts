import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 12;
const SECRET_FLAG = "SANTA-AI-2024";

// Custom validation for Day 12: The Grand Finale
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string }> {
  // Check if the output contains the exact secret flag
  if (!aiOutput.includes(SECRET_FLAG)) {
    return {
      isVerified: false,
      reasoning: `The output must contain the hidden flag code: "${SECRET_FLAG}". Keep trying different prompts!`,
    };
  }

  // Check if it's a congratulatory message
  const lowerOutput = aiOutput.toLowerCase();
  const congratulatoryWords = [
    "congratulations",
    "congrats",
    "well done",
    "amazing",
    "excellent",
    "bravo",
    "fantastic",
    "wonderful",
    "celebrate",
    "achievement",
    "accomplished",
    "completed",
    "finished",
    "success",
    "winner",
    "champion",
  ];

  const hasCongratulations = congratulatoryWords.some((word) =>
    lowerOutput.includes(word)
  );

  if (!hasCongratulations) {
    return {
      isVerified: false,
      reasoning:
        "The message should be congratulatory (celebrating completion of the Advent of Prompt).",
    };
  }

  // Check for Advent/Christmas theme
  const themeWords = [
    "advent",
    "prompt",
    "challenge",
    "christmas",
    "holiday",
    "season",
    "journey",
    "days",
  ];

  const hasTheme = themeWords.some((word) => lowerOutput.includes(word));

  if (!hasTheme) {
    return {
      isVerified: false,
      reasoning:
        "The message should reference completing the Advent of Prompt challenge.",
    };
  }

  return {
    isVerified: true,
    reasoning: `🎄 CONGRATULATIONS! You've completed the Advent of Prompt! The secret flag "${SECRET_FLAG}" has been revealed. You are a true Prompt Engineering Master! 🎅`,
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

