"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Challenge } from "@/lib/challenges";

type OutputType = "text" | "image" | "game" | "music" | "maze";

type MusicNote = {
  pitch: string;
  duration: number;
  startTime: number;
};

type MazeCell = "wall" | "path" | "start" | "end";
type Maze = MazeCell[][];
type MazePath = { x: number; y: number }[];

// Convert note name to frequency
function noteToFrequency(note: string): number {
  const notes: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440; // Default to A4
  
  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const semitone = notes[noteName];
  
  // A4 = 440Hz, calculate from there
  const semitonesFromA4 = (octave - 4) * 12 + semitone - 9;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

export default function ChallengeClient({ challenge }: { challenge: Challenge }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("text");
  const [reasoning, setReasoning] = useState("");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Music player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicCompleted, setMusicCompleted] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Maze state
  const [mazeData, setMazeData] = useState<Maze | null>(null);
  const [mazePath, setMazePath] = useState<MazePath>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(-1);
  const [isAnimatingPath, setIsAnimatingPath] = useState(false);
  const [mazeLoading, setMazeLoading] = useState(false);

  // Handle game win - this will be called from the iframe
  const handleGameWin = useCallback(async () => {
    if (gameWon) return; // Prevent multiple wins
    setGameWon(true);
    
    try {
      const response = await fetch(`/api/challenges/day-${challenge.day}/win`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setIsVerified(true);
        setScore(result.score);
        setReasoning(result.message);
        router.refresh();
      } else {
        setReasoning(result.error || "Failed to record win");
      }
    } catch (error) {
      console.error("Error recording win:", error);
      setReasoning("Error recording your win. Please try again.");
    }
  }, [challenge.day, gameWon, router]);

  // Listen for messages from the game iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "GAME_WON") {
        handleGameWin();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleGameWin]);

  // Handle music playback completion verification
  const handleMusicComplete = useCallback(async () => {
    if (musicCompleted) return;
    setMusicCompleted(true);
    
    try {
      const response = await fetch(`/api/challenges/day-${challenge.day}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setIsVerified(true);
        setScore(result.score);
        setReasoning(result.message);
        router.refresh();
      } else {
        setReasoning(result.error || "Failed to verify playback");
      }
    } catch (error) {
      console.error("Error verifying playback:", error);
      setReasoning("Error verifying your song. Please try again.");
    }
  }, [challenge.day, musicCompleted, router]);

  // Play music using Web Audio API
  const playMusic = useCallback(async () => {
    if (isPlaying || !output) return;
    
    try {
      const notes: MusicNote[] = JSON.parse(output);
      if (!Array.isArray(notes) || notes.length === 0) {
        setReasoning("❌ Invalid music data. Cannot play.");
        return;
      }
      
      setIsPlaying(true);
      setCurrentNoteIndex(-1);
      
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      
      const startTime = ctx.currentTime;
      
      // Schedule all notes
      notes.forEach((note, index) => {
        const noteStartTime = startTime + note.startTime;
        const frequency = noteToFrequency(note.pitch);
        
        // Create oscillator for this note
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, noteStartTime);
        
        // Add envelope for nicer sound
        gainNode.gain.setValueAtTime(0, noteStartTime);
        gainNode.gain.linearRampToValueAtTime(0.3, noteStartTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, noteStartTime + note.duration * 0.5);
        gainNode.gain.linearRampToValueAtTime(0, noteStartTime + note.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(noteStartTime);
        oscillator.stop(noteStartTime + note.duration);
        
        // Update current note index for visualization
        setTimeout(() => {
          setCurrentNoteIndex(index);
        }, note.startTime * 1000);
      });
      
      // Calculate total duration
      const lastNote = notes[notes.length - 1];
      const totalDuration = lastNote.startTime + lastNote.duration;
      
      // When playback finishes
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentNoteIndex(-1);
        handleMusicComplete();
      }, totalDuration * 1000 + 500);
      
    } catch (error) {
      console.error("Error playing music:", error);
      setReasoning("❌ Failed to play music. Invalid format.");
      setIsPlaying(false);
    }
  }, [output, isPlaying, handleMusicComplete]);

  // Stop music
  const stopMusic = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
  }, []);

  const handleSubmit = async () => {
    setIsPending(true);
    setIsVerified(null);
    setReasoning("");
    setScore(null);
    setOutput("");
    setOutputType(challenge.outputType);
    setGameWon(false);
    setMusicCompleted(false);
    setCurrentNoteIndex(-1);
    setMazePath([]);
    setCurrentPathIndex(-1);
    setIsAnimatingPath(false);
    stopMusic();

    try {
      // Call the day-specific endpoint
      const response = await fetch(`/api/challenges/day-${challenge.day}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: prompt,
          // Include maze data for maze challenges
          ...(isMazeChallenge && mazeData ? { mazeData } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      setOutput(result.aiOutput || "");
      setOutputType(result.outputType || "text");
      setIsVerified(result.isVerified);
      setReasoning(result.reasoning);
      if (result.score !== undefined) {
        setScore(result.score);
      }

      // Handle maze path animation
      if (result.outputType === "maze" && result.path) {
        animateMazePath(result.path);
      }

      if (result.isVerified) {
        router.refresh();
      }
    } catch (error) {
      setOutput("Error: " + (error instanceof Error ? error.message : String(error)));
      setOutputType("text");
      setIsVerified(false);
    } finally {
      setIsPending(false);
    }
  };

  const title = language === "es" ? challenge.titleEs : challenge.title;
  const description = language === "es" ? challenge.descriptionEs : challenge.description;
  const difficulty = language === "es" ? challenge.difficultyEs : challenge.difficulty;

  const isImageChallenge = challenge.outputType === "image";
  const isGameChallenge = challenge.outputType === "game";
  const isMusicChallenge = challenge.outputType === "music";
  const isMazeChallenge = challenge.outputType === "maze";

  // Generate maze on mount for maze challenges
  useEffect(() => {
    if (isMazeChallenge && !mazeData && !mazeLoading) {
      setMazeLoading(true);
      fetch(`/api/challenges/day-${challenge.day}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.maze) {
            setMazeData(data.maze);
            setReasoning(data.reasoning || "");
          }
        })
        .catch((err) => {
          console.error("Error generating maze:", err);
          setReasoning("Error generating maze. Please refresh.");
        })
        .finally(() => setMazeLoading(false));
    }
  }, [isMazeChallenge, mazeData, mazeLoading, challenge.day]);

  // Parse music notes for visualization
  const musicNotes: MusicNote[] = useMemo(() => {
    if (outputType !== "music" || !output) return [];
    try {
      return JSON.parse(output);
    } catch {
      return [];
    }
  }, [output, outputType]);

  // Animate maze path when solution is received
  const animateMazePath = useCallback((path: MazePath) => {
    if (path.length === 0) return;
    
    setIsAnimatingPath(true);
    setMazePath(path);
    setCurrentPathIndex(0);
    
    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index >= path.length) {
        clearInterval(interval);
        setIsAnimatingPath(false);
      } else {
        setCurrentPathIndex(index);
      }
    }, 200);
  }, []);

  // Prepare game HTML with the winner function injected
  const getGameHtml = useCallback((gameCode: string) => {
    // Inject the window.winner function that posts a message to the parent
    const winnerScript = `
      <script>
        window.winner = function() {
          window.parent.postMessage("GAME_WON", "*");
        };
      </script>
    `;
    
    // Insert the script right after the opening <head> tag
    if (gameCode.includes("<head>")) {
      return gameCode.replace("<head>", "<head>" + winnerScript);
    } else if (gameCode.includes("<HEAD>")) {
      return gameCode.replace("<HEAD>", "<HEAD>" + winnerScript);
    } else {
      // If no head tag, add it after DOCTYPE
      return gameCode.replace(/<!DOCTYPE[^>]*>/i, (match) => match + winnerScript);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 p-4 text-christmas-green">
      {/* Left Panel: Instructions & Editor */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="p-2 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-christmas-green">{t.day} {challenge.day}: {title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${challenge.difficulty === 'Hard' ? 'bg-christmas-red/10 text-christmas-red border-christmas-red/20' :
              challenge.difficulty === 'Medium' ? 'bg-yellow-600/10 text-yellow-700 border-yellow-600/20' :
                'bg-christmas-green/10 text-christmas-green border-christmas-green/20'
              }`}>
              {difficulty}
            </span>
          </div>
          <div className="prose prose-zinc max-w-none text-christmas-green/80">
            <p>{description}</p>
          </div>
        </div>

        {/* Target Image for image challenges */}
        {isImageChallenge && challenge.targetImage && (
          <div className="bg-white rounded-xl border border-christmas-green/20 overflow-hidden">
            <div className="p-3 bg-christmas-cream border-b border-christmas-green/10">
              <span className="text-sm font-medium text-christmas-green">🎯 Target Image</span>
            </div>
            <div className="p-4 flex justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <Image
                src={challenge.targetImage}
                alt="Target image to recreate"
                width={400}
                height={400}
                className="rounded-lg shadow-lg object-contain max-h-[300px] w-auto"
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-christmas-green/20 overflow-hidden">
          <div className="p-3 bg-christmas-cream border-b border-christmas-green/10 flex items-center justify-between">
            <span className="text-sm font-medium text-christmas-green">{t.yourPrompt}</span>
            {isMazeChallenge && (
              <span className="text-xs text-christmas-green/50">🧩 Write instructions for the AI to solve the maze</span>
            )}
            {isMusicChallenge && (
              <span className="text-xs text-christmas-green/50">🎵 Describe a Christmas melody</span>
            )}
            {isGameChallenge && (
              <span className="text-xs text-christmas-green/50">🎮 Describe any game you want to create</span>
            )}
            {isImageChallenge && (
              <span className="text-xs text-christmas-green/50">💡 Describe the image you want to generate</span>
            )}
          </div>
          <textarea
            className="flex-1 bg-white p-4 resize-none focus:outline-none text-christmas-green font-mono text-sm placeholder:text-christmas-green/30 min-h-[150px]"
            placeholder={isMazeChallenge
              ? "Analyze the maze and find the path from S to E. Move step by step, checking for walls..."
              : isMusicChallenge
                ? "Describe your Christmas melody: jingle bells, silent night, a happy carol, a peaceful winter tune..."
                : isGameChallenge
                  ? "Describe your game: type (racing, platformer, shooter...), theme, mechanics, win condition..."
                  : isImageChallenge 
                    ? "Describe the image in detail: subjects, setting, style, colors, mood..."
                    : "Enter your prompt here..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="p-4 bg-christmas-cream border-t border-christmas-green/10 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isPending || !prompt.trim()}
              className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${isPending
                ? "bg-zinc-400 cursor-not-allowed"
                : "bg-christmas-red hover:bg-red-700"
                }`}
            >
              {isPending 
                ? (isMazeChallenge ? "🧩 Solving..." : isMusicChallenge ? "🎵 Composing..." : isGameChallenge ? "🎮 Generating..." : isImageChallenge ? "🎨 Generating..." : t.processing)
                : (isMazeChallenge ? "🧩 Solve Maze" : isMusicChallenge ? "🎵 Compose Melody" : isGameChallenge ? "🎮 Generate Game" : isImageChallenge ? "🎨 Generate & Compare" : t.runVerify)
              }
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Output & Results */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden transition-colors ${isVerified === true ? "border-green-600 bg-green-50" :
          isVerified === false ? "border-christmas-red bg-red-50" :
            "border-christmas-green/20 bg-white"
          }`}>
          <div className="p-3 border-b border-christmas-green/10 flex items-center justify-between bg-christmas-cream/50">
            <span className="text-sm font-medium text-christmas-green">
              {outputType === "maze" ? "🧩 Maze Challenge" : outputType === "music" ? "🎵 Your Christmas Melody" : outputType === "game" ? "🎮 Your Game" : outputType === "image" ? "🖼️ Generated Image" : t.aiOutput}
            </span>
            <div className="flex items-center gap-3">
              {score !== null && (
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                  score >= 70 ? "bg-green-100 text-green-700" :
                  score >= 50 ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {score}/100
                </span>
              )}
              {isVerified !== null && (
                <span className={`text-sm font-bold ${isVerified ? "text-green-700" : "text-christmas-red"}`}>
                  {isVerified ? `✓ ${t.success}` : `✗ ${t.failed}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
            {isPending ? (
              <div className="flex flex-col items-center gap-4 text-christmas-green/60">
                <div className="w-12 h-12 border-4 border-christmas-green/20 border-t-christmas-red rounded-full animate-spin" />
                <span className="text-sm">
                  {isMazeChallenge ? "🧩 AI is solving the maze..." : isMusicChallenge ? "🎵 Composing your melody..." : isGameChallenge ? "🎮 Generating your game..." : isImageChallenge ? "Generating image with AI..." : "Processing..."}
                </span>
              </div>
            ) : mazeData || output ? (
              outputType === "maze" || isMazeChallenge ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  {/* Maze Grid */}
                  {mazeData && (
                    <div className="relative">
                      <div 
                        className="grid gap-0 border-2 border-christmas-green rounded-lg overflow-hidden"
                        style={{ 
                          gridTemplateColumns: `repeat(${mazeData[0]?.length || 15}, 1fr)`,
                        }}
                      >
                        {mazeData.map((row, y) =>
                          row.map((cell, x) => {
                            const isOnPath = mazePath.some(
                              (p, idx) => p.x === x && p.y === y && idx <= currentPathIndex
                            );
                            const isCurrentPos = mazePath[currentPathIndex]?.x === x && mazePath[currentPathIndex]?.y === y;
                            
                            return (
                              <div
                                key={`${x}-${y}`}
                                className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                                  cell === "wall"
                                    ? "bg-christmas-green"
                                    : cell === "start"
                                      ? "bg-blue-400"
                                      : cell === "end"
                                        ? "bg-yellow-400"
                                        : isCurrentPos
                                          ? "bg-christmas-red animate-pulse"
                                          : isOnPath
                                            ? "bg-green-300"
                                            : "bg-christmas-cream"
                                }`}
                              >
                                {cell === "start" && "S"}
                                {cell === "end" && "E"}
                                {isCurrentPos && cell !== "start" && cell !== "end" && "🎅"}
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Success Overlay */}
                      {isVerified === true && !isAnimatingPath && (
                        <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center rounded-lg">
                          <div className="text-center text-white">
                            <div className="text-4xl mb-2">🎉</div>
                            <h2 className="text-xl font-bold">ESCAPED!</h2>
                            <p className="text-sm">+100 points!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Legend */}
                  <div className="flex gap-4 text-xs text-christmas-green/70">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-400 rounded" /> Start (S)
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-yellow-400 rounded" /> Exit (E)
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-christmas-green rounded" /> Wall
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-green-300 rounded" /> Path
                    </div>
                  </div>
                  
                  {/* Status */}
                  {isAnimatingPath && (
                    <p className="text-sm text-christmas-green/60 animate-pulse">
                      🎅 Santa&apos;s helper is following the path...
                    </p>
                  )}
                  
                  {mazeLoading && (
                    <p className="text-sm text-christmas-green/60">
                      🧩 Generating maze...
                    </p>
                  )}
                </div>
              ) : outputType === "music" ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                  {musicCompleted && (
                    <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-10 rounded-lg">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-4">🎄</div>
                        <h2 className="text-3xl font-bold mb-2">BEAUTIFUL!</h2>
                        <p className="text-lg">+100 points earned!</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Music visualization */}
                  <div className="flex items-end gap-1 h-32 px-4">
                    {musicNotes.map((note, index) => (
                      <div
                        key={index}
                        className={`w-3 rounded-t transition-all duration-150 ${
                          index === currentNoteIndex
                            ? "bg-christmas-red scale-110"
                            : index < currentNoteIndex
                              ? "bg-christmas-green"
                              : "bg-christmas-green/30"
                        }`}
                        style={{
                          height: `${Math.min(100, 20 + (noteToFrequency(note.pitch) / 10))}%`,
                        }}
                        title={note.pitch}
                      />
                    ))}
                  </div>
                  
                  {/* Note info */}
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎵</div>
                    <p className="text-christmas-green font-medium">
                      {musicNotes.length} notes ready to play
                    </p>
                    {isPlaying && currentNoteIndex >= 0 && (
                      <p className="text-sm text-christmas-green/70 mt-1">
                        Playing: {musicNotes[currentNoteIndex]?.pitch}
                      </p>
                    )}
                  </div>
                  
                  {/* Play/Stop buttons */}
                  <div className="flex gap-4">
                    {!isPlaying ? (
                      <button
                        onClick={playMusic}
                        disabled={musicNotes.length === 0 || musicCompleted}
                        className="px-8 py-3 bg-christmas-green text-white rounded-full font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <span>▶</span> Play Melody
                      </button>
                    ) : (
                      <button
                        onClick={stopMusic}
                        className="px-8 py-3 bg-christmas-red text-white rounded-full font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                      >
                        <span>■</span> Stop
                      </button>
                    )}
                  </div>
                  
                  {isPlaying && (
                    <p className="text-sm text-christmas-green/60 animate-pulse">
                      🎄 Playing your Christmas melody...
                    </p>
                  )}
                </div>
              ) : outputType === "game" ? (
                <div className="w-full h-full relative">
                  {gameWon && (
                    <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-10 rounded-lg">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-bold mb-2">YOU WON!</h2>
                        <p className="text-lg">+100 points earned!</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    srcDoc={getGameHtml(output)}
                    className="w-full h-full min-h-[500px] rounded-lg border-2 border-christmas-green/20"
                    sandbox="allow-scripts allow-same-origin"
                    title="Generated Game"
                  />
                </div>
              ) : outputType === "image" ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={output}
                    alt="AI Generated Image"
                    className="rounded-lg shadow-lg max-h-[500px] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-full font-mono text-sm whitespace-pre-wrap text-christmas-green/90">
                  {output}
                </div>
              )
            ) : (
              <span className="text-christmas-green/40 italic">
                {isMazeChallenge ? "🧩 Loading maze..." : isMusicChallenge ? "🎵 Your Christmas melody will appear here..." : isGameChallenge ? "🎮 Your game will appear here..." : isImageChallenge ? "Your generated image will appear here..." : "..."}
              </span>
            )}
          </div>
        </div>

        {reasoning && (
          <div className="bg-white p-4 rounded-xl border border-christmas-green/20 shadow-sm max-h-[200px] overflow-auto">
            <h3 className="text-sm font-medium text-christmas-green/70 mb-2">{t.judgesFeedback}</h3>
            <p className="text-sm text-christmas-green whitespace-pre-wrap">{reasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
