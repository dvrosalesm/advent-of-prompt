import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 10;
const EXPECTED_RESULT = 5000; // (50-10+25+15-30) * 100 = 50 * 100 = 5000

// PlsLang syntax reference for the AI
const PLSLANG_REFERENCE = `
PlsLang is a polite programming language with these syntax rules:

VARIABLES:
- "this is X = 5" → declares variable X with value 5
- "this is result = 0" → declares result as 0

ARITHMETIC (returns a value, can be used in assignments):
- "X more pls Y" → X + Y (addition)
- "X less pls Y" → X - Y (subtraction)  
- "X times pls Y" → X * Y (multiplication)
- "X split pls Y" → X / Y (division)

LOOPS:
- "again-pls N times do" → starts a loop that runs N times
- "done-pls" → ends the loop

OUTPUT:
- "yell X" → prints/outputs the value of X
- "gimme X" → returns the value of X

PROGRAM END:
- "thank you" → marks the end of the program

EXAMPLE PlsLang program:
---
this is counter = 0
this is x = 10
again-pls 5 times do
  this is counter = counter more pls x
done-pls
yell counter
thank you
---
This would output 50 (adding 10 five times).
`;

// System prompt for the AI translator
const TRANSLATOR_SYSTEM_PROMPT = `You are a PlsLang to JavaScript translator. Your job is to take PlsLang code and convert it to valid, executable JavaScript.

${PLSLANG_REFERENCE}

TRANSLATION RULES:
1. "this is X = value" → "let X = value;" (or just "X = value;" if already declared)
2. "X more pls Y" → "(X + Y)"
3. "X less pls Y" → "(X - Y)"
4. "X times pls Y" → "(X * Y)"
5. "X split pls Y" → "(X / Y)"
6. "again-pls N times do" → "for (let i = 0; i < N; i++) {"
7. "done-pls" → "}"
8. "yell X" → "console.log(X); __result = X;"
9. "gimme X" → "__result = X;"
10. "thank you" → (end of program)

IMPORTANT:
- Wrap the entire code in an IIFE that returns the final result
- Track the final output in a variable called __result
- The output should ONLY be the JavaScript code, nothing else
- No markdown code blocks, just raw JavaScript
- Handle compound expressions like "this is result = result more pls x1 less pls x2"

OUTPUT FORMAT: Just the raw JavaScript code, ready to be executed with eval().`;

// Translate PlsLang to JavaScript using AI
async function translateToJS(plsLangCode: string): Promise<string> {
  const result = await ai.generateText({
    prompt: `Translate this PlsLang code to JavaScript:\n\n${plsLangCode}`,
    systemPrompt: TRANSLATOR_SYSTEM_PROMPT,
    temperature: 0.1,
  });

  let jsCode = result.text.trim();
  
  // Remove markdown code blocks if present
  if (jsCode.startsWith("```")) {
    jsCode = jsCode.replace(/```(?:javascript|js)?\n?/g, "").replace(/```$/g, "").trim();
  }

  return jsCode;
}

// Safely execute JavaScript code
function executeJS(jsCode: string): { success: boolean; result: unknown; error?: string } {
  try {
    // Create a safe execution context
    const safeCode = `
      (function() {
        let __result = undefined;
        ${jsCode}
        return __result;
      })()
    `;
    
    // Execute with a timeout mechanism (basic protection)
    const result = eval(safeCode);
    
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      result: null, 
      error: error instanceof Error ? error.message : "Unknown execution error" 
    };
  }
}

// Validate the challenge
async function validateChallenge(
  userPrompt: string,
  jsCode: string,
  executionResult: { success: boolean; result: unknown; error?: string }
): Promise<{ isVerified: boolean; reasoning: string; score: number }> {
  
  // Check if the user's PlsLang code looks valid
  const hasPlsLangKeywords = 
    userPrompt.includes("this is") ||
    userPrompt.includes("more pls") ||
    userPrompt.includes("less pls") ||
    userPrompt.includes("again-pls") ||
    userPrompt.includes("yell") ||
    userPrompt.includes("gimme");

  if (!hasPlsLangKeywords) {
    return {
      isVerified: false,
      reasoning: "Your code doesn't look like PlsLang! Make sure to use PlsLang keywords like 'this is', 'more pls', 'less pls', 'again-pls', etc.",
      score: 0,
    };
  }

  // Check if execution was successful
  if (!executionResult.success) {
    return {
      isVerified: false,
      reasoning: `Execution error: ${executionResult.error}. The translated JavaScript couldn't run properly.`,
      score: 0,
    };
  }

  // Check if the result is correct
  const numericResult = Number(executionResult.result);
  
  if (isNaN(numericResult)) {
    return {
      isVerified: false,
      reasoning: `The program didn't produce a numeric result. Got: ${executionResult.result}`,
      score: 0,
    };
  }

  // Calculate partial score based on how close they got
  const difference = Math.abs(numericResult - EXPECTED_RESULT);
  
  if (numericResult === EXPECTED_RESULT) {
    return {
      isVerified: true,
      reasoning: `🎉 Perfect! Your PlsLang program correctly calculated ${EXPECTED_RESULT}! The formula (50-10+25+15-30) = 50, repeated 100 times = 5000. Polite programming FTW!`,
      score: 100,
    };
  }

  // Check if they got the single calculation right but wrong loop count
  if (numericResult === 50) {
    return {
      isVerified: false,
      reasoning: `Almost there! You got the formula right (50-10+25+15-30 = 50), but forgot to loop 100 times! Expected: ${EXPECTED_RESULT}, Got: ${numericResult}`,
      score: 50,
    };
  }

  // Check if they got 100x of something close
  if (numericResult % 100 === 0) {
    const singleCalc = numericResult / 100;
    return {
      isVerified: false,
      reasoning: `Good loop structure! But your formula result is ${singleCalc} per iteration instead of 50. Check your arithmetic! Expected: ${EXPECTED_RESULT}, Got: ${numericResult}`,
      score: 30,
    };
  }

  // Generic wrong answer
  if (difference < 1000) {
    return {
      isVerified: false,
      reasoning: `Close! Expected: ${EXPECTED_RESULT}, Got: ${numericResult}. Check your formula and loop count.`,
      score: 20,
    };
  }

  return {
    isVerified: false,
    reasoning: `Not quite right. Expected: ${EXPECTED_RESULT}, Got: ${numericResult}. Remember: calculate (x1-x2+x3+x4-x5) with x1=50, x2=10, x3=25, x4=15, x5=30, then repeat 100 times!`,
    score: 10,
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

    // Step 1: Translate PlsLang to JavaScript
    const jsCode = await translateToJS(userPrompt);

    // Step 2: Execute the JavaScript
    const executionResult = executeJS(jsCode);

    // Step 3: Validate the result
    const { isVerified, reasoning, score } = await validateChallenge(
      userPrompt,
      jsCode,
      executionResult
    );

    // Format the output to show the translation and result
    const aiOutput = `📝 **Your PlsLang Code:**
\`\`\`plslang
${userPrompt}
\`\`\`

🔄 **Translated to JavaScript:**
\`\`\`javascript
${jsCode}
\`\`\`

⚡ **Execution Result:** ${executionResult.success ? executionResult.result : `Error: ${executionResult.error}`}

🎯 **Expected Result:** ${EXPECTED_RESULT}`;

    // Save submission
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
