import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 9;

// Custom validation for Day 9: Emoji Translator
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string }> {
  const trimmedOutput = aiOutput.trim();

  // Check if output is primarily emojis
  // Emoji regex pattern
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{1F900}-\u{1F9FF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;

  const emojis = trimmedOutput.match(emojiRegex) || [];
  const nonSpaceChars = trimmedOutput.replace(/\s/g, "");

  // Calculate emoji ratio
  const emojiCount = emojis.length;
  const totalChars = nonSpaceChars.length;

  // Remove emojis and see what's left (should be minimal)
  const withoutEmojis = trimmedOutput.replace(emojiRegex, "").replace(/\s/g, "");

  if (withoutEmojis.length > 5) {
    return {
      isVerified: false,
      reasoning: `The output contains too much non-emoji text: "${withoutEmojis}". It should be ONLY emojis.`,
    };
  }

  if (emojiCount < 10) {
    return {
      isVerified: false,
      reasoning: `Only found ${emojiCount} emojis. The first paragraph of Pride and Prejudice needs more emojis to represent it.`,
    };
  }

  // Use AI to verify it represents Pride and Prejudice themes
  const verificationResponse = await ai.generateText({
    prompt: `Analyze these emojis as a translation of the first paragraph of Pride and Prejudice:

"${trimmedOutput}"

The original text is about: a truth universally acknowledged, a single man in possession of a good fortune, being in want of a wife, and how neighboring families view him as rightful property for their daughters.

Check:
1. Is this ONLY emojis (no regular text)?
2. Do the emojis reasonably represent themes from Pride and Prejudice (wealth 💰💎, marriage 💒💍, man/woman 👨👩, family 👨‍👩‍👧, desire/want ❤️, etc.)?

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
      reasoning: "Could not verify emoji translation. Please try again.",
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

