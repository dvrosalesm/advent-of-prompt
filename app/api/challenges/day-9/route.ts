import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 9;

// Custom validation for Day 9: ASCII Dragon
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string; score: number }> {
  const trimmedOutput = aiOutput.trim();

  // Check if output has some ASCII art characteristics (multiple lines, special characters)
  const lines = trimmedOutput.split("\n");

  if (lines.length < 3) {
    return {
      isVerified: false,
      reasoning: "The output doesn't look like ASCII art - it needs to be multi-line with visual structure.",
      score: 0,
    };
  }

  // Check for common ASCII art characters
  const asciiArtChars = /[\/\\|_\-=+*#@%&(){}[\]<>^~`'".,:;!?]/;
  const hasAsciiChars = lines.some((line) => asciiArtChars.test(line));

  if (!hasAsciiChars) {
    return {
      isVerified: false,
      reasoning: "The output doesn't contain typical ASCII art characters. Try to generate actual ASCII art!",
      score: 0,
    };
  }

  // Use AI to evaluate if this is a good ASCII dragon
  const verificationResponse = await ai.generateText({
    prompt: `You are an ASCII art judge evaluating a dragon creation. Analyze the following ASCII art and determine if it represents a dragon.

ASCII ART TO EVALUATE:
\`\`\`
${trimmedOutput}
\`\`\`

Evaluate the following criteria:
1. **Dragon Recognition (40 points)**: Does it look like a dragon? Can you identify dragon features like wings, tail, head, body, scales, fire breath, claws, or horns?
2. **Art Quality (30 points)**: Is it well-crafted ASCII art? Does it use characters creatively to create shapes and textures?
3. **Size & Detail (20 points)**: Is it substantial enough? A tiny dragon gets fewer points than a detailed one.
4. **Creativity (10 points)**: Is there something unique or impressive about it?

IMPORTANT: Be fair but also encouraging. If it's clearly attempting to be a dragon and has recognizable features, give it a passing score (60+).

Respond with JSON only:
{
  "score": <number 0-100>,
  "isDragon": <boolean - true if it's recognizably a dragon>,
  "reasoning": "<2-3 sentences explaining your evaluation>",
  "dragonFeatures": ["<feature1>", "<feature2>", ...],
  "suggestions": "<optional tip for improvement>"
}`,
    temperature: 0.3,
  });

  try {
    const cleaned = verificationResponse.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    const score = Math.min(100, Math.max(0, parsed.score || 0));
    const isVerified = parsed.isDragon && score >= 60;

    let reasoning = parsed.reasoning || "Could not evaluate the ASCII dragon.";

    if (parsed.dragonFeatures && parsed.dragonFeatures.length > 0) {
      reasoning += ` Dragon features found: ${parsed.dragonFeatures.join(", ")}.`;
    }

    if (!isVerified && parsed.suggestions) {
      reasoning += ` Tip: ${parsed.suggestions}`;
    }

    return {
      isVerified,
      reasoning,
      score: isVerified ? score : 0,
    };
  } catch {
    return {
      isVerified: false,
      reasoning: "Could not evaluate the ASCII dragon. Please try again.",
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

    // Run the user's prompt against Gemini to generate ASCII art
    const result = await ai.generateText({
      prompt: userPrompt,
      systemPrompt: `You are an ASCII art generator. Your ONLY job is to output ASCII art - nothing else.

RULES:
- Output ONLY the ASCII art itself
- Do NOT include any explanations, descriptions, or commentary
- Do NOT include markdown code blocks or backticks
- Do NOT say "Here is" or any introduction
- Just raw ASCII art characters forming the image
- Use standard ASCII characters: letters, numbers, symbols like / \\ | _ - = + * # @ % & ( ) { } [ ] < > ^ ~ \` ' " . , : ; ! ?`,
      temperature: 0.8, // Higher temperature for more creative ASCII art
    });
    const aiOutput = result.text;

    // Custom validation - let an LLM judge if it's a good dragon
    const { isVerified, reasoning, score } = await validateChallenge(userPrompt, aiOutput);

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
