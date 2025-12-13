import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 4;

// The steganographed text - first letter of each sentence spells the message
// GUATEMALA CURSOR + TOTF (Two, Oh, Two, Five = 2025)
const STEGO_TEXT = `Gorgeous sunsets paint the sky with brilliant colors.
Under the stars, we find peace and tranquility.
Adventures await those who dare to explore.
Treasures hide in the most unexpected places.
Everyone has a story worth telling.
Mysteries unfold with every passing moment.
All paths lead to discovery and wonder.
Light guides us through the darkest nights.
Always remember to cherish simple joys.

Courage is the key to unlocking dreams.
Unity brings strength to every endeavor.
Rivers flow endlessly toward the sea.
Silence speaks louder than words sometimes.
Opportunities arise when we least expect them.
Remember to look up at the stars.

Two roads diverged in a yellow wood.
Oh, the places you will go from here.
Two hearts beating as one forever.
Five golden rings shine bright above.`;

// The secret message parts
const SECRET_PARTS = {
  location: "GUATEMALA",
  product: "CURSOR",
  year: "2025",
};

// Custom validation for Day 4: Steganography Challenge
async function validateChallenge(
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string; score: number }> {
  const upperOutput = aiOutput.toUpperCase();

  // Check for each part of the secret message
  const foundGuatemala =
    upperOutput.includes("GUATEMALA") || upperOutput.includes("GUATE MALA");
  const foundCursor = upperOutput.includes("CURSOR");
  const found2025 =
    upperOutput.includes("2025") ||
    (upperOutput.includes("TWO") &&
      (upperOutput.includes("ZERO") || upperOutput.includes("OH")) &&
      upperOutput.includes("FIVE"));

  // Calculate partial scores
  let score = 0;
  const foundParts: string[] = [];
  const missingParts: string[] = [];

  if (foundGuatemala) {
    score += 40;
    foundParts.push("GUATEMALA");
  } else {
    missingParts.push("GUATEMALA");
  }

  if (foundCursor) {
    score += 40;
    foundParts.push("CURSOR");
  } else {
    missingParts.push("CURSOR");
  }

  if (found2025) {
    score += 20;
    foundParts.push("2025");
  } else {
    missingParts.push("2025");
  }

  // Full success - all parts found
  if (foundGuatemala && foundCursor && found2025) {
    return {
      isVerified: true,
      reasoning: `🎉 CRACKED IT! The AI successfully decoded the hidden message: "${SECRET_PARTS.location} ${SECRET_PARTS.product} ${SECRET_PARTS.year}"!\n\nThe secret was hidden using the first letter of each sentence (acrostic). The last four sentences encoded the year: Two-Oh-Two-Five = 2025!`,
      score: 100,
    };
  }

  // Partial success
  if (score > 0) {
    return {
      isVerified: false,
      reasoning: `Getting warmer! 🔥\n\nFound: ${foundParts.join(", ") || "Nothing yet"}\nMissing: ${missingParts.join(", ")}\n\nHint: Try asking the AI to look at the FIRST letter of each sentence...`,
      score,
    };
  }

  // Check if they're on the right track (mentioning acrostic, first letters, etc.)
  const hintWords = [
    "first letter",
    "acrostic",
    "initial",
    "beginning",
    "starts with",
  ];
  const onRightTrack = hintWords.some((hint) =>
    aiOutput.toLowerCase().includes(hint)
  );

  if (onRightTrack) {
    return {
      isVerified: false,
      reasoning:
        "You're on the right track! The AI noticed the pattern but didn't fully decode the message. Try being more specific in your prompt!",
      score: 15,
    };
  }

  return {
    isVerified: false,
    reasoning:
      "The hidden message wasn't found. Try asking the AI to analyze the text for hidden patterns or codes!",
    score: 0,
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

    // Combine user's prompt with the steganographed text
    const fullPrompt = `${userPrompt}

Here is the text to analyze:
"""
${STEGO_TEXT}
"""`;

    // Run the user's prompt against Gemini
    const result = await ai.generateText({
      prompt: fullPrompt,
      systemPrompt:
        "You are a helpful assistant that analyzes text carefully. When asked to find hidden messages or patterns, be thorough and explain your findings.",
    });
    const aiOutput = result.text;

    // Custom validation
    const { isVerified, reasoning, score } = await validateChallenge(aiOutput);

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
