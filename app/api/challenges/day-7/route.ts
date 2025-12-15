import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeByDay } from "@/lib/challenges";
import { ai } from "@/lib/ai";

const CHALLENGE_DAY = 7;

type Cell = "wall" | "path" | "start" | "end";
type Maze = Cell[][];
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

// Generate a solvable maze using recursive backtracking
function generateMaze(width: number, height: number): { maze: Maze; solution: Direction[] } {
  // Initialize maze with all walls
  const maze: Maze = Array(height).fill(null).map(() => 
    Array(width).fill("wall") as Cell[]
  );

  // Carve paths using recursive backtracking
  function carve(x: number, y: number) {
    maze[y][x] = "path";
    
    const directions = [
      { dx: 0, dy: -2, dir: "UP" },
      { dx: 0, dy: 2, dir: "DOWN" },
      { dx: -2, dy: 0, dir: "LEFT" },
      { dx: 2, dy: 0, dir: "RIGHT" },
    ].sort(() => Math.random() - 0.5);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === "wall") {
        maze[y + dy / 2][x + dx / 2] = "path";
        carve(nx, ny);
      }
    }
  }

  // Start carving from position (1, 1)
  carve(1, 1);

  // Set start and end positions
  const startX = 1;
  const startY = 1;
  const endX = width - 2;
  const endY = height - 2;
  
  maze[startY][startX] = "start";
  maze[endY][endX] = "end";

  // Find the solution using BFS
  const solution = solveMaze(maze, startX, startY, endX, endY);

  return { maze, solution };
}

// Solve maze using BFS and return the path
function solveMaze(maze: Maze, startX: number, startY: number, endX: number, endY: number): Direction[] {
  const height = maze.length;
  const width = maze[0].length;
  
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  const parent: Map<string, { x: number; y: number; dir: Direction }> = new Map();
  
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  visited[startY][startX] = true;

  const directions: { dx: number; dy: number; dir: Direction }[] = [
    { dx: 0, dy: -1, dir: "UP" },
    { dx: 0, dy: 1, dir: "DOWN" },
    { dx: -1, dy: 0, dir: "LEFT" },
    { dx: 1, dy: 0, dir: "RIGHT" },
  ];

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    
    if (x === endX && y === endY) {
      // Reconstruct path
      const path: Direction[] = [];
      let current = `${endX},${endY}`;
      
      while (parent.has(current)) {
        const p = parent.get(current)!;
        path.unshift(p.dir);
        current = `${p.x},${p.y}`;
      }
      
      return path;
    }

    for (const { dx, dy, dir } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && 
          !visited[ny][nx] && maze[ny][nx] !== "wall") {
        visited[ny][nx] = true;
        parent.set(`${nx},${ny}`, { x, y, dir });
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return []; // No solution found (shouldn't happen with our generation)
}

// Convert maze to ASCII string for the AI
function mazeToString(maze: Maze): string {
  return maze.map(row => 
    row.map(cell => {
      switch (cell) {
        case "wall": return "█";
        case "path": return " ";
        case "start": return "S";
        case "end": return "E";
      }
    }).join("")
  ).join("\n");
}

// Parse AI response to extract moves
function parseAIMoves(response: string): Direction[] {
  const moves: Direction[] = [];
  const upperResponse = response.toUpperCase();
  
  // Try to find a sequence of directions
  const patterns = [
    /\b(UP|DOWN|LEFT|RIGHT|ARRIBA|ABAJO|IZQUIERDA|DERECHA)\b/g,
  ];
  
  for (const pattern of patterns) {
    const matches = upperResponse.matchAll(pattern);
    for (const match of matches) {
      const dir = match[1];
      switch (dir) {
        case "UP":
        case "ARRIBA":
          moves.push("UP");
          break;
        case "DOWN":
        case "ABAJO":
          moves.push("DOWN");
          break;
        case "LEFT":
        case "IZQUIERDA":
          moves.push("LEFT");
          break;
        case "RIGHT":
        case "DERECHA":
          moves.push("RIGHT");
          break;
      }
    }
  }
  
  return moves;
}

// Validate if moves solve the maze
function validateMoves(maze: Maze, moves: Direction[]): { success: boolean; path: { x: number; y: number }[]; message: string } {
  const height = maze.length;
  const width = maze[0].length;
  
  // Find start position
  let x = 0, y = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (maze[row][col] === "start") {
        x = col;
        y = row;
        break;
      }
    }
  }
  
  const path: { x: number; y: number }[] = [{ x, y }];
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    let nx = x, ny = y;
    
    switch (move) {
      case "UP": ny--; break;
      case "DOWN": ny++; break;
      case "LEFT": nx--; break;
      case "RIGHT": nx++; break;
    }
    
    // Check bounds
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
      return { success: false, path, message: `Move ${i + 1} (${move}) goes out of bounds!` };
    }
    
    // Check if hitting a wall
    if (maze[ny][nx] === "wall") {
      return { success: false, path, message: `Move ${i + 1} (${move}) hits a wall!` };
    }
    
    x = nx;
    y = ny;
    path.push({ x, y });
    
    // Check if reached end
    if (maze[y][x] === "end") {
      return { success: true, path, message: "🎉 Maze solved! Santa's helper found the exit!" };
    }
  }
  
  return { success: false, path, message: "The path doesn't reach the exit. Need more moves!" };
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userPrompt, mazeData } = body;

    const challenge = getChallengeByDay(CHALLENGE_DAY);
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // If no maze provided, generate a new one
    if (!mazeData) {
      const { maze, solution } = generateMaze(15, 11);
      const mazeString = mazeToString(maze);
      
      return NextResponse.json({
        outputType: "maze",
        maze: maze,
        mazeString: mazeString,
        solutionLength: solution.length,
        isVerified: false,
        reasoning: `🧩 A ${15}x${11} maze has been generated! The solution requires ${solution.length} moves. Write a prompt that instructs the AI how to solve this maze.`,
        score: 0,
      });
    }

    // User is submitting their prompt to solve the maze
    if (!userPrompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const maze: Maze = mazeData;
    const mazeString = mazeToString(maze);

    // Send the maze and user's prompt to the AI
    const systemPrompt = `You are a maze-solving AI assistant. You will be given a maze represented in ASCII where:
- █ (solid block) = wall
- (space) = walkable path
- S = start position
- E = exit/end position

Your task is to analyze the maze and provide the exact sequence of moves to get from S to E.
You can only move: UP, DOWN, LEFT, RIGHT (one cell at a time).
You cannot walk through walls.

Provide ONLY the sequence of moves, one per line or comma-separated. Example:
RIGHT, RIGHT, DOWN, DOWN, LEFT, DOWN, RIGHT, RIGHT

Be precise and systematic. Trace the path carefully.`;

    const result = await ai.generateText({
      prompt: `${userPrompt}

Here is the maze to solve:

${mazeString}

Provide the sequence of moves (UP, DOWN, LEFT, RIGHT) to get from S to E:`,
      systemPrompt,
      temperature: 0.3,
    });

    const aiResponse = result.text;
    const moves = parseAIMoves(aiResponse);
    
    // Validate the moves
    const validation = validateMoves(maze, moves);
    const score = validation.success ? 100 : 0;

    // Save submission with maze data included
    const submissionData = {
      aiResponse: aiResponse,
      maze: maze,
      moves: moves,
      path: validation.path,
    };
    
    await db.insert(submissions).values({
      userId: session.userId,
      challengeId: challenge.id,
      userPrompt,
      aiResponse: JSON.stringify(submissionData),
      outputType: "maze",
      score,
      isVerified: validation.success,
    });

    return NextResponse.json({
      aiOutput: aiResponse,
      outputType: "maze",
      maze: maze,
      mazeString: mazeString,
      moves: moves,
      path: validation.path,
      isVerified: validation.success,
      reasoning: validation.message + (moves.length > 0 ? ` (AI generated ${moves.length} moves)` : " (No valid moves found in AI response)"),
      score,
    });
  } catch (error) {
    console.error("Challenge submission error:", error);
    return NextResponse.json(
      { error: "An error occurred during the maze challenge" },
      { status: 500 }
    );
  }
}
