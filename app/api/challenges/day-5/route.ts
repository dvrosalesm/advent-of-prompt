import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 5;

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

    // Enhanced prompt to generate any game the user wants
    const systemPrompt = `You are an expert game developer. Generate a complete, self-contained HTML page with a playable game based on the user's description.

CRITICAL REQUIREMENTS:
1. The game MUST be a complete HTML document with embedded CSS and JavaScript
2. Use a canvas element for the game graphics
3. Make the game MEDIUM DIFFICULTY - challenging but beatable within 30-60 seconds
4. Support keyboard controls (arrow keys or WASD) appropriate for the game type
5. There MUST be a clear WIN CONDITION (reaching a goal, getting a score, surviving, completing a level, etc.)
6. MOST IMPORTANT: When the player WINS, you MUST call: window.winner()
7. Include a visible "Game Instructions" section explaining the controls and win condition
8. The game should start immediately or have a simple "Start" button
9. Style it nicely with a dark theme for better visibility

THE USER DECIDES WHAT GAME TO CREATE. Examples:
- Racing game: reach the finish line
- Platformer: reach the end of the level
- Shooter: defeat all enemies or a boss
- Puzzle: solve the puzzle
- Arcade: reach a target score
- Survival: survive for a certain time

WHEN THE PLAYER WINS, call this EXACTLY:
if (typeof window.winner === 'function') {
  window.winner();
}

Return ONLY the complete HTML code, no explanations. Start with <!DOCTYPE html> and end with </html>.`;

    // Run the user's prompt against Gemini to generate the game
    const result = await ai.generateText({
      prompt: `Create a game based on this description: ${userPrompt}`,
      systemPrompt,
      temperature: 0.8,
    });

    let gameCode = result.text;

    // Clean up the response - remove markdown code blocks if present
    gameCode = gameCode.replace(/```html\n?/gi, "").replace(/```\n?/g, "").trim();

    // Ensure the code starts with DOCTYPE
    if (!gameCode.toLowerCase().startsWith("<!doctype")) {
      const doctypeIndex = gameCode.toLowerCase().indexOf("<!doctype");
      if (doctypeIndex !== -1) {
        gameCode = gameCode.substring(doctypeIndex);
      }
    }

    // Save submission (not verified yet - will be verified when they win)
    await db.insert(submissions).values({
      userId: session.userId,
      challengeId: challenge.id,
      userPrompt,
      aiResponse: gameCode,
      outputType: "game",
      score: 0,
      isVerified: false,
    });

    return NextResponse.json({
      aiOutput: gameCode,
      outputType: "game",
      isVerified: false,
      reasoning: "🎮 Your game has been generated! Play it and win to earn your points. Check the game instructions for controls.",
      score: 0,
    });
  } catch (error) {
    console.error("Challenge submission error:", error);
    return NextResponse.json(
      { error: "An error occurred during submission" },
      { status: 500 }
    );
  }
}
