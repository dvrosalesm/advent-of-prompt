import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";
import { readFileSync } from "fs";
import { join } from "path";

const CHALLENGE_DAY = 1;
const PASSING_SCORE = 60; // Similarity score needed to pass

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

    // Generate image using Gemini Imagen
    const imageResult = await ai.generateImage(userPrompt);
    const generatedBase64 = imageResult.images[0]?.base64;

    if (!generatedBase64) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Load target image as base64
    const targetImagePath = join(process.cwd(), "public", "challenges", "day-1-target.png");
    const targetImageBuffer = readFileSync(targetImagePath);
    const targetBase64 = targetImageBuffer.toString("base64");

    // Compare images using Gemini Vision
    const comparison = await ai.compareImages(
      targetBase64,
      generatedBase64,
      PASSING_SCORE
    );

    const isVerified = comparison.isPass;
    const score = comparison.similarityScore;
    const reasoning = `Score: ${score}/100\n\n${comparison.reasoning}\n\n✅ Matching: ${comparison.matchingElements.join(", ") || "None"}\n\n❌ Missing: ${comparison.missingElements.join(", ") || "None"}`;

    // Create a data URL for the generated image
    const generatedImageUrl = `data:image/png;base64,${generatedBase64}`;

    // Save submission with score and outputType
    await db.insert(submissions).values({
      userId: session.userId,
      challengeId: challenge.id,
      userPrompt,
      aiResponse: generatedImageUrl,
      outputType: "image",
      score,
      isVerified,
    });

    return NextResponse.json({
      aiOutput: generatedImageUrl,
      outputType: "image",
      isVerified,
      reasoning,
      score,
    });
  } catch (error) {
    console.error("Challenge submission error:", error);
    return NextResponse.json(
      { error: "An error occurred during submission: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
