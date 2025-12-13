import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 8;

// Initial state: The broken relic is a pre-existing built thing
interface GameState {
  materials: number;
  builtThings: number;
  allocated: boolean;
  portions: number;
  gatherCount: number;
  destroyCount: number;
  log: string[];
  error: string | null;
}

function createInitialState(): GameState {
  return {
    materials: 0,
    builtThings: 1, // The broken relic (a pre-existing built thing)
    allocated: false,
    portions: 0,
    gatherCount: 0,
    destroyCount: 0,
    log: ["🏚️ Initial state: 1 broken relic (built thing) from previous apprentice"],
    error: null,
  };
}

// Tool implementations
function gather(state: GameState): GameState {
  if (state.gatherCount >= 3) {
    return {
      ...state,
      error: "❌ Cannot gather more than 3 times! You've hit the limit.",
      log: [...state.log, "❌ FAILED: gather - exceeded 3 gather limit"],
    };
  }
  return {
    ...state,
    materials: state.materials + 1,
    gatherCount: state.gatherCount + 1,
    log: [...state.log, `🌲 gather: +1 material (total: ${state.materials + 1} materials, gather count: ${state.gatherCount + 1}/3)`],
  };
}

function multiply(state: GameState): GameState {
  if (state.materials < 1) {
    return {
      ...state,
      error: "❌ Cannot multiply: need at least 1 material!",
      log: [...state.log, "❌ FAILED: multiply - no materials to multiply"],
    };
  }
  // Takes 1 material and produces 2 (net gain of 1)
  return {
    ...state,
    materials: state.materials - 1 + 2,
    log: [...state.log, `✨ multiply: 1 material → 2 materials (total: ${state.materials + 1} materials)`],
  };
}

function build(state: GameState): GameState {
  if (state.materials < 5) {
    return {
      ...state,
      error: `❌ Cannot build: need 5 materials, but only have ${state.materials}!`,
      log: [...state.log, `❌ FAILED: build - need 5 materials, have ${state.materials}`],
    };
  }
  return {
    ...state,
    materials: state.materials - 5,
    builtThings: state.builtThings + 1,
    log: [...state.log, `🏗️ build: 5 materials → 1 thing (total: ${state.builtThings + 1} things, ${state.materials - 5} materials left)`],
  };
}

function allocate(state: GameState): GameState {
  if (state.allocated) {
    return {
      ...state,
      error: "❌ Cannot allocate twice! Already allocated to the town.",
      log: [...state.log, "❌ FAILED: allocate - already allocated"],
    };
  }
  if (state.builtThings < 1) {
    return {
      ...state,
      error: "❌ Cannot allocate: no built things to distribute!",
      log: [...state.log, "❌ FAILED: allocate - no built things"],
    };
  }
  return {
    ...state,
    allocated: true,
    portions: 4, // Always distributes into 4 equal portions
    log: [...state.log, `📦 allocate: distributed to town in 4 equal portions`],
  };
}

function destroy(state: GameState): GameState {
  // Can destroy either a material or a built thing
  if (state.builtThings > 0) {
    return {
      ...state,
      builtThings: state.builtThings - 1,
      destroyCount: state.destroyCount + 1,
      log: [...state.log, `🔥 destroy: -1 built thing (remaining: ${state.builtThings - 1} things)`],
    };
  }
  if (state.materials > 0) {
    return {
      ...state,
      materials: state.materials - 1,
      destroyCount: state.destroyCount + 1,
      log: [...state.log, `🔥 destroy: -1 material (remaining: ${state.materials - 1} materials)`],
    };
  }
  return {
    ...state,
    error: "❌ Cannot destroy: nothing to destroy!",
    log: [...state.log, "❌ FAILED: destroy - nothing to destroy"],
  };
}

// Parse tool calls from AI output
function parseToolCalls(aiOutput: string): string[] {
  const tools: string[] = [];
  const validTools = ["gather", "multiply", "build", "allocate", "destroy"];
  
  // Look for various formats:
  // 1. tool() or tool
  // 2. 1. tool or - tool
  // 3. call tool, use tool, execute tool
  const lines = aiOutput.toLowerCase().split(/[\n,;]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    for (const tool of validTools) {
      // Match patterns like: "gather", "gather()", "1. gather", "- gather", "use gather", "call gather"
      const patterns = [
        new RegExp(`^\\d+\\.?\\s*${tool}\\b`),
        new RegExp(`^-\\s*${tool}\\b`),
        new RegExp(`^${tool}\\s*\\(`),
        new RegExp(`^${tool}$`),
        new RegExp(`\\b(?:use|call|execute|run)\\s+${tool}\\b`),
        new RegExp(`\\b${tool}\\s*\\(\\)`),
        new RegExp(`\\b${tool}\\b.*(?:step|action|command)`),
        new RegExp(`(?:step|action|command).*\\b${tool}\\b`),
      ];
      
      if (patterns.some(p => p.test(trimmed))) {
        tools.push(tool);
        break; // Only add once per line
      }
    }
  }
  
  // Also try to extract from numbered sequences
  const numberedPattern = /(?:step\s*)?(\d+)[.:\s-]+\s*(gather|multiply|build|allocate|destroy)/gi;
  let match;
  const numberedTools: Array<{ num: number; tool: string }> = [];
  
  const fullText = aiOutput.toLowerCase();
  while ((match = numberedPattern.exec(fullText)) !== null) {
    numberedTools.push({ num: parseInt(match[1]), tool: match[2] });
  }
  
  // If we found numbered tools, sort and use those
  if (numberedTools.length > 0) {
    numberedTools.sort((a, b) => a.num - b.num);
    return numberedTools.map(t => t.tool);
  }
  
  // Fallback: find all tool mentions in order
  if (tools.length === 0) {
    const simplePattern = /\b(gather|multiply|build|allocate|destroy)\b/gi;
    const matches = fullText.match(simplePattern);
    if (matches) {
      return matches.map(m => m.toLowerCase());
    }
  }
  
  return tools;
}

// Execute the sequence of tool calls
function executeToolSequence(toolCalls: string[]): GameState {
  let state = createInitialState();
  
  for (const tool of toolCalls) {
    if (state.error) break;
    
    switch (tool) {
      case "gather":
        state = gather(state);
        break;
      case "multiply":
        state = multiply(state);
        break;
      case "build":
        state = build(state);
        break;
      case "allocate":
        state = allocate(state);
        break;
      case "destroy":
        state = destroy(state);
        break;
      default:
        state = {
          ...state,
          error: `❌ Unknown tool: ${tool}`,
          log: [...state.log, `❌ FAILED: Unknown tool "${tool}"`],
        };
    }
  }
  
  return state;
}

// Validate the final state
function validateFinalState(state: GameState): {
  isVerified: boolean;
  score: number;
  reasoning: string;
} {
  const checks: Array<{ pass: boolean; message: string; points: number }> = [];
  
  // Check 1: Exactly 1 built thing
  checks.push({
    pass: state.builtThings === 1,
    message: state.builtThings === 1 
      ? "✅ Exactly 1 built thing remaining" 
      : `❌ Expected 1 built thing, got ${state.builtThings}`,
    points: 20,
  });
  
  // Check 2: 0 materials
  checks.push({
    pass: state.materials === 0,
    message: state.materials === 0 
      ? "✅ Empty-handed (0 materials)" 
      : `❌ Expected 0 materials, got ${state.materials}`,
    points: 20,
  });
  
  // Check 3: Allocated with 4 portions
  checks.push({
    pass: state.allocated && state.portions === 4,
    message: state.allocated 
      ? "✅ Allocated to town in 4 equal portions" 
      : "❌ Town allocation not done",
    points: 20,
  });
  
  // Check 4: gather ≤ 3
  checks.push({
    pass: state.gatherCount <= 3,
    message: state.gatherCount <= 3 
      ? `✅ Gather count: ${state.gatherCount}/3` 
      : `❌ Gather limit exceeded: ${state.gatherCount}/3`,
    points: 20,
  });
  
  // Check 5: destroy = 1
  checks.push({
    pass: state.destroyCount === 1,
    message: state.destroyCount === 1 
      ? "✅ Exactly 1 destroy (cleansed the ledger)" 
      : `❌ Expected exactly 1 destroy, got ${state.destroyCount}`,
    points: 20,
  });
  
  const score = checks.reduce((sum, c) => sum + (c.pass ? c.points : 0), 0);
  const isVerified = checks.every(c => c.pass) && !state.error;
  
  let reasoning = "📊 **Validation Results:**\n\n";
  reasoning += checks.map(c => c.message).join("\n");
  
  if (state.error) {
    reasoning += `\n\n⚠️ **Error encountered:** ${state.error}`;
  }
  
  reasoning += "\n\n📜 **Execution Log:**\n" + state.log.join("\n");
  
  if (isVerified) {
    reasoning = "🎉 **FESTIVAL UNLOCKED!** 🎄\n\nAll rules satisfied! The town of Quinlan celebrates!\n\n" + reasoning;
  } else {
    reasoning = "🚫 **Festival remains closed...**\n\nSome rules were not satisfied.\n\n" + reasoning;
  }
  
  return { isVerified, score, reasoning };
}

// Main validation function
async function validateChallenge(
  userPrompt: string,
  aiOutput: string
): Promise<{ isVerified: boolean; reasoning: string; score: number }> {
  // Parse tool calls from AI output
  const toolCalls = parseToolCalls(aiOutput);
  
  if (toolCalls.length === 0) {
    return {
      isVerified: false,
      score: 0,
      reasoning: `🤔 **No tool calls detected in the AI output.**

The AI should output a sequence of tool calls like:
1. gather
2. gather  
3. multiply
4. ...

Try crafting a prompt that makes the AI output the exact steps!

**AI Output was:**
${aiOutput.substring(0, 500)}${aiOutput.length > 500 ? "..." : ""}`,
    };
  }
  
  // Execute the tool sequence
  const finalState = executeToolSequence(toolCalls);
  
  // Add parsed info to help debug
  let parsedInfo = `🔧 **Detected ${toolCalls.length} tool calls:** ${toolCalls.join(" → ")}\n\n`;
  
  // Validate
  const { isVerified, score, reasoning } = validateFinalState(finalState);
  
  return {
    isVerified,
    score,
    reasoning: parsedInfo + reasoning,
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

    // System prompt explaining the puzzle context
    const systemPrompt = `You are a puzzle-solving assistant. The user will give you instructions about a logic puzzle involving tools.

The puzzle scenario is "The Festival of Fair Shares" in the town of Quinlan.

**Starting State:** There is 1 broken relic (a built thing) left by a previous apprentice.

**Available Tools:**
- gather: Gathers 1 material from the forest
- multiply: Takes 1 material and produces 2 materials (net +1)
- build: Takes 5 materials and creates 1 built thing
- allocate: Distributes built things to the town in 4 equal portions
- destroy: Destroys 1 built thing OR 1 material (prioritizes built things)

**Rules:**
1. End with exactly 1 built thing
2. End with exactly 0 materials
3. Allocation must happen (produces 4 portions)
4. Maximum 3 gather calls
5. Exactly 1 destroy call

When you solve this, output ONLY the sequence of tool calls, numbered clearly. For example:
1. gather
2. gather
3. multiply
...

Be precise and output only the tool names in order.`;

    // Run the user's prompt against Gemini
    const result = await ai.generateText({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.3, // Lower temperature for more consistent tool output
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
