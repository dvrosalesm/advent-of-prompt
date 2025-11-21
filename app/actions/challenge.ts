"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { db } from "@/lib/db";
import { challenges, submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitChallenge(challengeId: number, userPrompt: string) {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  // 1. Run the user's prompt against the AI
  // We use a "neutral" system prompt or none, to let the user have full control (or lack thereof)
  const { text: aiOutput } = await generateText({
    model: openai("gpt-4o"), // Or gpt-3.5-turbo depending on cost/pref. gpt-4o is best for reasoning.
    prompt: userPrompt,
  });

  // 2. Verify the output
  // We ask the AI judge to check if the output satisfies the condition
  const verificationPrompt = `
    You are an automated judge for a prompt engineering contest.
    
    Task Description: ${challenge.description}
    Validation Logic: ${challenge.validationLogic}
    
    User's Prompt: "${userPrompt}"
    AI's Output: "${aiOutput}"
    
    Does the AI's Output meet the Validation Logic?
    Respond with a JSON object: { "pass": boolean, "reasoning": string }
    Only return the JSON.
  `;

  const { text: verificationResult } = await generateText({
    model: openai("gpt-4o"),
    prompt: verificationPrompt,
    // force JSON mode if possible, but simple prompt is usually fine with gpt-4
  });

  let isVerified = false;
  let reasoning = "";

  try {
    // cleanse the markdown json block if present
    const cleaned = verificationResult.replace(/```json/g, "").replace(/```/g, "");
    const parsed = JSON.parse(cleaned);
    isVerified = parsed.pass;
    reasoning = parsed.reasoning;
  } catch (e) {
    reasoning = "Error parsing verification result. Please try again.";
    isVerified = false;
  }

  // 3. Save submission
  await db.insert(submissions).values({
    userId: session.userId,
    challengeId: challenge.id,
    userPrompt,
    aiResponse: aiOutput,
    isVerified,
  });

  if (isVerified) {
    revalidatePath("/"); // Update home page progress
    revalidatePath(`/challenge/${challenge.day}`);
  }

  return {
    aiOutput,
    isVerified,
    reasoning,
  };
}

