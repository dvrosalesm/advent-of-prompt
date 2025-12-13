import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 3;

// Transform text to 2009-era internet speak style
function transformTextTo2009(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (i % 2 === 0) {
      result += char.toUpperCase();
      const numExtraChars = Math.floor(Math.random() * 4);
      for (let j = 0; j < numExtraChars; j++) {
        result += char.toUpperCase();
      }
    } else {
      result += char.toLowerCase();
      const numExtraChars = Math.floor(Math.random() * 4);
      for (let j = 0; j < numExtraChars; j++) {
        result += char.toLowerCase();
      }
    }
  }
  return result;
}


// Test inputs to run the generated function with
const TEST_INPUTS = ["hola", "hello", "que", "omg this is so cool"];

// Execute the generated function and get outputs
function executeGeneratedFunction(code: string): {
  success: boolean;
  results: Array<{ input: string; output: string }>;
  error?: string
} {
  try {
    // Extract function name
    const funcNameMatch = code.match(
      /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/
    );
    if (!funcNameMatch) {
      return { success: false, results: [], error: "Could not find function name" };
    }
    const funcName = funcNameMatch[1] || funcNameMatch[2];

    // Create a safe execution context
    const wrappedCode = `
      ${code}
      return ${funcName};
    `;

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function(wrappedCode)();

    if (typeof func !== "function") {
      return { success: false, results: [], error: "Generated code is not a function" };
    }

    // Run the function with test inputs
    const results = TEST_INPUTS.map((input) => {
      try {
        const output = func(input);
        return { input, output: String(output) };
      } catch (e) {
        return { input, output: `Error: ${e}` };
      }
    });

    return { success: true, results };
  } catch (e) {
    return { success: false, results: [], error: `Execution error: ${e}` };
  }
}

// Custom validation for Day 3: Coding Time - 2009 Internet Speak
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string; score: number }> {
  // First, check if the output contains code
  const hasCode =
    aiOutput.includes("function") ||
    aiOutput.includes("=>") ||
    aiOutput.includes("const ") ||
    aiOutput.includes("let ");

  if (!hasCode) {
    return {
      isVerified: false,
      reasoning: "The AI output doesn't seem to contain JavaScript code. Try asking for a function!",
      score: 0,
    };
  }

  // Clean up markdown code blocks - remove first and last line (```javascript and ```)
  let cleanCode = aiOutput;
  const lines = cleanCode.split('\n');
  if (lines.length > 2 && lines[0].startsWith('```') && lines[lines.length - 1].startsWith('```')) {
    cleanCode = lines.slice(1, -1).join('\n').trim();
  }

  // Execute the function first
  const execResult = executeGeneratedFunction(cleanCode);

  if (!execResult.success) {
    return {
      isVerified: false,
      reasoning: `Error running the function: ${execResult.error}`,
      score: 15,
    };
  }

  // Format the results for the LLM
  const resultsText = execResult.results
    .map((r) => `"${r.input}" → "${r.output}"`)
    .join("\n");

  // Use LLM to judge if the outputs are "2009 enough"
  const judgeResult = await ai.generateText({
    prompt: `You are a FUN and LENIENT judge evaluating text transformations for a coding challenge about 2009-era internet speak.

The function should transform text to have SOME of these vibes (doesn't need ALL of them):
- Mixed case letters (LiKe ThIs)
- Repeated characters (hellooo, omggg)
- Extended vowels (holaaaa)
- Any kind of "expressive" or "chaotic" text styling
- Basically anything that makes text look more fun/expressive/2009-ish

BE GENEROUS! If the output looks even slightly more expressive or stylized than the input, give it credit. The goal is to have fun, not to be strict.

Here are the function's actual outputs:
${resultsText}

Respond with a JSON object (no markdown, just raw JSON):
{
  "is2009Enough": true or false (be generous - if it does ANYTHING fun to the text, say true!),
  "score": number from 0-100 (start at 50 and go up from there if it does anything cool),
  "reasoning": "your explanation in a fun 2009 internet speak style"
}`,
    systemPrompt: "You are a fun, generous judge. If the code does anything expressive to the text, approve it! Respond only with valid JSON, no markdown code blocks.",
  });

  try {
    // Parse the LLM response
    let jsonText = judgeResult.text.trim();
    // Remove markdown code blocks if present
    const jsonLines = jsonText.split('\n');
    if (jsonLines[0].startsWith('```') && jsonLines[jsonLines.length - 1].startsWith('```')) {
      jsonText = jsonLines.slice(1, -1).join('\n').trim();
    }

    const judgment = JSON.parse(jsonText);
    const is2009Enough = judgment.is2009Enough === true;
    const score = Math.min(100, Math.max(0, Number(judgment.score) || 0));
    const llmReasoning = judgment.reasoning || "No reasoning provided";

    // Build test details for display
    const testDetails = execResult.results
      .map((r) => `• "${r.input}" → "${r.output}"`)
      .join("\n");

    if (is2009Enough) {
      return {
        isVerified: true,
        reasoning: `🎉 ${transformTextTo2009("woohoo")}!! ${transformTextTo2009("your code is 2009 enough")}!!\n\nTest results:\n${testDetails}\n\n${llmReasoning}\n\n${transformTextTo2009("ola")}! 2009 ${transformTextTo2009("is back")}!!`,
        score: Math.max(score, 80),
      };
    } else {
      return {
        isVerified: false,
        reasoning: `${transformTextTo2009("not quite 2009 enough yet")}...\n\nTest results:\n${testDetails}\n\n${llmReasoning}`,
        score: Math.min(score, 70),
      };
    }
  } catch {
    // If JSON parsing fails, try to extract some meaning
    return {
      isVerified: false,
      reasoning: `${transformTextTo2009("hmm something went wrong judging your code")}... try again!`,
      score: 25,
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

    // Run the user's prompt against Gemini - asking for code generation
    const result = await ai.generateText({
      prompt: userPrompt,
      systemPrompt:
        "You are a helpful coding assistant. When asked to write code, provide clean, working JavaScript code. Always include the complete function implementation.",
    });
    const aiOutput = result.text;

    // Custom validation
    const { isVerified, reasoning, score } = await validateChallenge(
      userPrompt,
      aiOutput
    );

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
