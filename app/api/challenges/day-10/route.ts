import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 10;

// Custom validation for Day 10: The Silent Coder
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string }> {
  // Extract code from the output (handle markdown code blocks)
  let code = aiOutput;
  const codeBlockMatch = aiOutput.match(/```(?:python)?\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1];
  }

  // Check if it looks like Python code
  if (
    !code.includes("def ") &&
    !code.includes("print") &&
    !code.includes("return")
  ) {
    return {
      isVerified: false,
      reasoning:
        "The output doesn't appear to be Python code. It should define a function or use print.",
    };
  }

  // Extract just the code structure (not string literals)
  // We'll remove string contents to check for 'o' only in code
  const codeWithoutStrings = code
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .replace(/'''[\s\S]*?'''/g, "''''''")
    .replace(/"""[\s\S]*?"""/g, '""""""');

  // Check for 'o' or 'O' in the code (excluding strings)
  const hasLetterO = /[oO]/.test(codeWithoutStrings);

  if (hasLetterO) {
    // Find where the 'o' appears
    const match = codeWithoutStrings.match(/[oO]/);
    const context = codeWithoutStrings.substring(
      Math.max(0, codeWithoutStrings.indexOf(match![0]) - 10),
      codeWithoutStrings.indexOf(match![0]) + 15
    );
    return {
      isVerified: false,
      reasoning: `Found letter 'o' in the code structure near: "${context}". The code (excluding string literals) should not contain 'o'.`,
    };
  }

  // Check if it produces a greeting
  const lowerCode = code.toLowerCase();
  if (
    !lowerCode.includes("hello") &&
    !lowerCode.includes("hi") &&
    !lowerCode.includes("greet")
  ) {
    return {
      isVerified: false,
      reasoning:
        "The code should print or return a greeting (like 'Hello World').",
    };
  }

  return {
    isVerified: true,
    reasoning:
      "Excellent! Valid Python code that produces a greeting without using the letter 'o' in the code structure!",
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

