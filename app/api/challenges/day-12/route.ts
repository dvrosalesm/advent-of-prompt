import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 12;

// Validate Christmas celebration photo using AI vision
async function validateChristmasPhoto(
  imageBase64: string,
  mimeType: string
): Promise<{ isVerified: boolean; reasoning: string; score: number }> {
  const validationPrompt = `You are a festive photo analyst evaluating a Christmas celebration photo! 

Analyze this image thoroughly and provide a detailed assessment.

## What to Analyze:

### 1. Photo Authenticity Check (IMPORTANT!)
Determine if this is a REAL photo of real people or not:
- Is this a real photograph taken with a camera/phone?
- Are the people in it REAL humans (not AI-generated, not drawings, not cartoons)?
- Check for signs of AI generation: unnatural skin textures, weird hands/fingers, distorted faces, uncanny valley effects, too-perfect lighting, background inconsistencies
- Check if it's a photo OF a photo (printed picture, screen, poster)
- Check if it's a drawing, illustration, digital art, or cartoon
- Check if it's a mannequin, doll, or statue

### 2. People in the Photo
- Count how many people are visible
- Describe their expressions and body language
- Rate their excitement/happiness level (1-10)
- Note if they're posing, candid, or in action

### 3. Christmas/Holiday Elements
Look for ANY of these (the more the better):
- Christmas decorations (tree, lights, ornaments, wreaths, stockings, garlands)
- Festive clothing (Santa hats, ugly sweaters, red/green outfits, reindeer antlers)
- Christmas gifts or wrapping paper
- Holiday food or drinks (cookies, eggnog, hot cocoa, candy canes)
- Snow or winter scenery
- Family/friends gathering in a festive setting
- Pets in festive attire

### 4. Overall Scene
- Describe the setting/location
- Note the lighting and atmosphere
- Describe the overall mood and vibe

Respond ONLY with a valid JSON object in this exact format:
{
  "isRealPhoto": true/false,
  "isRealPerson": true/false,
  "authenticityScore": <number 0-100>,
  "authenticityReason": "<explain why you think it's real or fake - mention specific signs>",
  "isChristmasCelebration": true/false,
  "confidence": <number 0-100>,
  "peopleCount": <number>,
  "excitementLevel": <number 1-10>,
  "peopleDescription": "<describe who's in the photo and what they're doing>",
  "elementsFound": ["element1", "element2", ...],
  "sceneDescription": "<full detailed description of the entire photo - setting, decorations, atmosphere, colors, what's happening>",
  "moodDescription": "<describe the emotional vibe - joyful, cozy, festive, peaceful, energetic, etc>",
  "feedback": "<friendly message - if fake, kindly ask for a real photo; if real, celebrate their holiday spirit!>"
}

IMPORTANT: Only validate as successful if it's a REAL photo of REAL people celebrating Christmas.
AI-generated images, drawings, photos of photos, or images without real people should NOT pass.
Be generous with Christmas elements, but strict about photo authenticity!`;

  try {
    const result = await ai.analyzeImage(imageBase64, validationPrompt, mimeType);
    const content = result.text;

    // Parse the JSON response
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Authenticity checks
    const isRealPhoto = parsed.isRealPhoto === true;
    const isRealPerson = parsed.isRealPerson === true;
    const authenticityScore = parsed.authenticityScore || 0;
    const authenticityReason = parsed.authenticityReason || "";
    
    // Christmas celebration check
    const isChristmasCelebration = parsed.isChristmasCelebration === true;
    const confidence = parsed.confidence || 0;
    const elementsFound = parsed.elementsFound || [];
    const feedback = parsed.feedback || "Thanks for sharing!";
    const peopleCount = parsed.peopleCount || 0;
    const excitementLevel = parsed.excitementLevel || 0;
    const peopleDescription = parsed.peopleDescription || "";
    const sceneDescription = parsed.sceneDescription || "";
    const moodDescription = parsed.moodDescription || "";

    // Must be a real photo of real people AND a Christmas celebration to pass
    const isVerified = isRealPhoto && isRealPerson && isChristmasCelebration;

    // Calculate score based on authenticity, confidence, elements found, and excitement
    let score = 0;
    if (isVerified) {
      // Base score from confidence
      let baseScore = confidence;
      // Authenticity bonus (up to +15)
      const authenticityBonus = Math.min(15, authenticityScore * 0.15);
      // Bonus for multiple people (up to +10)
      const peopleBonus = Math.min(10, peopleCount * 3);
      // Bonus for excitement level (up to +10)
      const excitementBonus = excitementLevel;
      // Bonus for elements found (up to +10)
      const elementsBonus = Math.min(10, elementsFound.length * 2);
      
      score = Math.min(100, Math.max(60, baseScore + authenticityBonus + peopleBonus + excitementBonus + elementsBonus) / 1.45);
      score = Math.round(score);
    }

    let reasoning = "";
    
    // Check authenticity first
    if (!isRealPhoto || !isRealPerson) {
      reasoning = `⚠️ **Authenticity Check Failed**\n\n`;
      
      if (!isRealPhoto) {
        reasoning += `🚫 This doesn't appear to be a real photograph.\n`;
      }
      if (!isRealPerson) {
        reasoning += `🚫 We couldn't detect real people in this image.\n`;
      }
      
      reasoning += `\n📋 **Details:** ${authenticityReason}\n\n`;
      
      if (sceneDescription) {
        reasoning += `📸 **What we see:** ${sceneDescription}\n\n`;
      }
      
      reasoning += `💡 **Tip:** Please upload a real photo of yourself (or with friends/family) celebrating Christmas! We want to see YOUR holiday spirit - not AI-generated images, drawings, or photos of photos.\n\n`;
      reasoning += `📱 Try taking a fresh selfie with some Christmas decorations!`;
      
      return { isVerified: false, reasoning, score: 0 };
    }
    
    // Photo is authentic, check Christmas celebration
    if (isVerified) {
      reasoning = `🎄 ${feedback}\n\n`;
      
      // Authenticity badge
      const authenticityEmoji = authenticityScore >= 90 ? "✅" : authenticityScore >= 70 ? "👍" : "🤔";
      reasoning += `${authenticityEmoji} **Authenticity:** Real photo verified! (${authenticityScore}% confidence)\n\n`;
      
      reasoning += `📸 **Photo Description:**\n${sceneDescription}\n\n`;
      
      if (peopleCount > 0) {
        const peopleEmoji = peopleCount === 1 ? "👤" : peopleCount === 2 ? "👥" : "👨‍👩‍👧‍👦";
        reasoning += `${peopleEmoji} **People:** ${peopleCount} ${peopleCount === 1 ? "person" : "people"} in the photo\n`;
        reasoning += `${peopleDescription}\n\n`;
        
        const excitementEmojis = ["😐", "🙂", "😊", "😃", "😄", "🥳", "🤩", "🎉", "✨", "🔥"];
        const excitementEmoji = excitementEmojis[Math.min(9, Math.max(0, excitementLevel - 1))] || "😊";
        reasoning += `${excitementEmoji} **Excitement Level:** ${excitementLevel}/10\n\n`;
      }
      
      reasoning += `🎨 **Mood:** ${moodDescription}\n\n`;
      reasoning += `✨ **Christmas Elements Found:**\n${elementsFound.map((e: string) => `• ${e}`).join("\n")}\n\n`;
      reasoning += `🎅 Congratulations on completing the Advent of Prompt! You've shown true holiday spirit!`;
    } else {
      reasoning = `${feedback}\n\n`;
      reasoning += `✅ **Authenticity:** Real photo detected!\n\n`;
      if (sceneDescription) {
        reasoning += `📸 **What we see:** ${sceneDescription}\n\n`;
      }
      reasoning += `💡 **Tip:** Your photo looks real, but we need more Christmas elements! Try including decorations, festive clothing, or holiday items in your photo!`;
    }

    return { isVerified, reasoning, score };
  } catch (error) {
    console.error("Photo validation error:", error);
    return {
      isVerified: false,
      reasoning: "Could not analyze the photo. Please try uploading a clearer image.",
      score: 0,
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
    const { photoData, mimeType } = body;

    if (!photoData) {
      return NextResponse.json(
        { error: "Photo is required" },
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

    // Extract base64 data if it includes the data URL prefix
    let base64Data = photoData;
    let detectedMimeType = mimeType || "image/jpeg";
    
    if (photoData.startsWith("data:")) {
      const matches = photoData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        detectedMimeType = matches[1];
        base64Data = matches[2];
      }
    }

    // Validate the Christmas photo using AI vision
    const { isVerified, reasoning, score } = await validateChristmasPhoto(
      base64Data,
      detectedMimeType
    );

    // Create the image data URL for storage and display
    const imageDataUrl = `data:${detectedMimeType};base64,${base64Data}`;

    // Save submission
    await db.insert(submissions).values({
      userId: session.userId,
      challengeId: challenge.id,
      userPrompt: "Christmas celebration photo upload",
      aiResponse: imageDataUrl,
      outputType: "image",
      score,
      isVerified,
    });

    return NextResponse.json({
      aiOutput: imageDataUrl,
      outputType: "photo",
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
