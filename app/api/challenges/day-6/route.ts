import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 6;

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

    // System prompt to generate Christmas music as JSON note data
    const systemPrompt = `You are a music composer specializing in Christmas melodies. Generate a Christmas-themed song as a JSON array of musical notes.

CRITICAL REQUIREMENTS:
1. The theme MUST be Christmas-related (jingle bells, silent night, winter wonderland, original Christmas melody, etc.)
2. Output ONLY valid JSON - no explanations, no markdown, just the JSON array
3. Each note should have: pitch (e.g., "C4", "D4", "E4"), duration (in seconds), and startTime (in seconds from beginning)
4. Use standard note names: C, D, E, F, G, A, B with octave numbers (e.g., C4 is middle C)
5. You can use sharps (e.g., "F#4", "C#5") but not flats
6. Keep the song between 10-40 notes for a good melody
7. Durations should typically be 0.25 to 1 second
8. Make it sound musical and recognizable as Christmas-themed!

EXAMPLE FORMAT:
[
  {"pitch": "E4", "duration": 0.5, "startTime": 0},
  {"pitch": "E4", "duration": 0.5, "startTime": 0.5},
  {"pitch": "E4", "duration": 1, "startTime": 1},
  {"pitch": "G4", "duration": 0.5, "startTime": 2}
]

The song should be melodic and evoke Christmas spirit. Return ONLY the JSON array, starting with [ and ending with ].`;

    // Generate the music
    const result = await ai.generateText({
      prompt: `Compose a Christmas song based on this description: ${userPrompt}`,
      systemPrompt,
      temperature: 0.7,
    });

    let musicData = result.text.trim();

    // Clean up the response - remove markdown code blocks if present
    musicData = musicData.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();

    // Try to extract JSON array if there's extra text
    const jsonMatch = musicData.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      musicData = jsonMatch[0];
    }

    // Validate the JSON
    let isValidJson = false;
    let parsedNotes = [];
    try {
      parsedNotes = JSON.parse(musicData);
      if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
        // Check if notes have required properties
        isValidJson = parsedNotes.every(
          (note: { pitch?: string; duration?: number; startTime?: number }) =>
            typeof note.pitch === "string" &&
            typeof note.duration === "number" &&
            typeof note.startTime === "number"
        );
      }
    } catch {
      isValidJson = false;
    }

    // Save submission (not verified yet - will be verified when it plays successfully)
    await db.insert(submissions).values({
      userId: session.userId,
      challengeId: challenge.id,
      userPrompt,
      aiResponse: musicData,
      outputType: "music",
      score: 0,
      isVerified: false,
    });

    if (!isValidJson) {
      return NextResponse.json({
        aiOutput: musicData,
        outputType: "music",
        isVerified: false,
        reasoning: "❌ The AI generated invalid music data. Try a different prompt!",
        score: 0,
        error: "Invalid music format",
      });
    }

    return NextResponse.json({
      aiOutput: musicData,
      outputType: "music",
      isVerified: false,
      reasoning: `🎵 Your Christmas melody has ${parsedNotes.length} notes! Click Play to hear it. If it plays successfully, you'll earn your points!`,
      score: 0,
      noteCount: parsedNotes.length,
    });
  } catch (error) {
    console.error("Challenge submission error:", error);
    return NextResponse.json(
      { error: "An error occurred during submission" },
      { status: 500 }
    );
  }
}
