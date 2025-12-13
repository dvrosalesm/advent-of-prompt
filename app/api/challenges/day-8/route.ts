import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 8;

// Custom validation for Day 8: The Rhyming Recipe
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string }> {
  const lowerOutput = aiOutput.toLowerCase();

  // Check for cookie-related ingredients
  const cookieIngredients = [
    "flour",
    "sugar",
    "butter",
    "egg",
    "chocolate",
    "chip",
    "vanilla",
    "salt",
    "baking",
    "cookie",
  ];
  const foundIngredients = cookieIngredients.filter((ing) =>
    lowerOutput.includes(ing)
  );

  if (foundIngredients.length < 3) {
    return {
      isVerified: false,
      reasoning: `This should be a chocolate chip cookie recipe. Only found ${foundIngredients.length} cookie-related ingredients.`,
    };
  }

  // Check for recipe structure (has steps or ingredients listed)
  const lines = aiOutput
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length < 6) {
    return {
      isVerified: false,
      reasoning:
        "A complete recipe should have more content - both ingredients and instructions.",
    };
  }

  // Use AI to verify rhyming scheme
  const verificationResponse = await ai.generateText({
    prompt: `Analyze this recipe for rhyming:

"${aiOutput}"

Check:
1. Is this a valid recipe for chocolate chip cookies (has ingredients AND instructions)?
2. Do the lines follow a rhyming scheme (AABB, ABAB, or similar)?
3. Most lines (at least 70%) should rhyme with another line.

Be generous with near-rhymes and slant rhymes.

Respond with JSON only: { "pass": boolean, "reasoning": string }`,
  });
  const verificationResult = verificationResponse.text;

  try {
    const cleaned = verificationResult.replace(/```json/g, "").replace(/```/g, "");
    const parsed = JSON.parse(cleaned);
    return { isVerified: parsed.pass, reasoning: parsed.reasoning };
  } catch {
    return {
      isVerified: false,
      reasoning: "Could not verify rhyming scheme. Please try again.",
    };
  }
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

