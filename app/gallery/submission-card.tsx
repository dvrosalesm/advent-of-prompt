"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

type MusicNote = {
  pitch: string;
  duration: number;
  startTime: number;
};

type MazeCell = "wall" | "path" | "start" | "end";
type Maze = MazeCell[][];

// Convert note name to frequency
function noteToFrequency(note: string): number {
  const notes: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const semitone = notes[noteName];

  const semitonesFromA4 = (octave - 4) * 12 + semitone - 9;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

type SubmissionCardProps = {
  submission: {
    id: number;
    userPrompt: string;
    aiResponse: string | null;
    outputType: string;
    score: number;
    createdAt: string;
    user: { name: string | null };
    challenge: { day: number; title: string; titleEs: string; description: string; descriptionEs: string; outputType: string; targetImage: string | null };
    votes: { userId: number }[];
    comments: { id: number; content: string; user: { name: string | null } }[];
  };
  currentUserId: number | null;
};

export default function SubmissionCard({ submission, currentUserId }: SubmissionCardProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localVotes, setLocalVotes] = useState(submission.votes);
  const [localComments, setLocalComments] = useState(submission.comments);
  const [showComments, setShowComments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [isMounted, setIsMounted] = useState(false);
  const [isMazeReplaying, setIsMazeReplaying] = useState(false);
  const [mazePathIndex, setMazePathIndex] = useState(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mazeReplayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup maze replay on unmount
  useEffect(() => {
    return () => {
      if (mazeReplayRef.current) {
        clearInterval(mazeReplayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const isLoggedIn = currentUserId !== null;
  const hasVoted = isLoggedIn && localVotes.some((v) => v.userId === currentUserId);
  const voteCount = localVotes.length;
  const outputType = submission.outputType || submission.challenge.outputType;
  const isImageOutput = outputType === "image" || outputType === "photo";
  const isGameOutput = outputType === "game";
  const isMusicOutput = outputType === "music";
  const isMazeOutput = outputType === "maze";

  const musicNotes: MusicNote[] = useMemo(() => {
    if (!isMusicOutput || !submission.aiResponse) return [];
    try {
      return JSON.parse(submission.aiResponse);
    } catch {
      return [];
    }
  }, [isMusicOutput, submission.aiResponse]);

  const mazeSubmission: { maze: Maze | null; aiResponse: string | null; moves: string[]; path: { x: number; y: number }[] } = useMemo(() => {
    if (!isMazeOutput || !submission.aiResponse) return { maze: null, aiResponse: null, moves: [], path: [] };
    try {
      const parsed = JSON.parse(submission.aiResponse);
      if (parsed.maze) {
        return {
          maze: parsed.maze,
          aiResponse: parsed.aiResponse || null,
          moves: parsed.moves || [],
          path: parsed.path || [],
        };
      }
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        return { maze: parsed, aiResponse: null, moves: [], path: [] };
      }
      return { maze: null, aiResponse: submission.aiResponse, moves: [], path: [] };
    } catch {
      return { maze: null, aiResponse: submission.aiResponse, moves: [], path: [] };
    }
  }, [isMazeOutput, submission.aiResponse]);

  const mazeData = mazeSubmission.maze;

  const playMusic = useCallback(async () => {
    if (isPlaying || musicNotes.length === 0) return;

    setIsPlaying(true);
    setCurrentNoteIndex(-1);

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const startTime = ctx.currentTime;

    musicNotes.forEach((note, index) => {
      const noteStartTime = startTime + note.startTime;
      const frequency = noteToFrequency(note.pitch);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStartTime);

      gainNode.gain.setValueAtTime(0, noteStartTime);
      gainNode.gain.linearRampToValueAtTime(0.3, noteStartTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, noteStartTime + note.duration * 0.5);
      gainNode.gain.linearRampToValueAtTime(0, noteStartTime + note.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(noteStartTime);
      oscillator.stop(noteStartTime + note.duration);

      setTimeout(() => {
        setCurrentNoteIndex(index);
      }, note.startTime * 1000);
    });

    const lastNote = musicNotes[musicNotes.length - 1];
    const totalDuration = lastNote.startTime + lastNote.duration;

    setTimeout(() => {
      setIsPlaying(false);
      setCurrentNoteIndex(-1);
    }, totalDuration * 1000 + 500);
  }, [musicNotes, isPlaying]);

  const stopMusic = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
  }, []);

  const replayMaze = useCallback(() => {
    if (isMazeReplaying || mazeSubmission.path.length === 0) return;

    setIsMazeReplaying(true);
    setMazePathIndex(-1);

    let step = 0;
    mazeReplayRef.current = setInterval(() => {
      if (step >= mazeSubmission.path.length) {
        if (mazeReplayRef.current) {
          clearInterval(mazeReplayRef.current);
        }
        setIsMazeReplaying(false);
        setMazePathIndex(mazeSubmission.path.length); // Show full path
        return;
      }
      setMazePathIndex(step);
      step++;
    }, 100); // 100ms per step
  }, [isMazeReplaying, mazeSubmission.path]);

  const stopMazeReplay = useCallback(() => {
    if (mazeReplayRef.current) {
      clearInterval(mazeReplayRef.current);
      mazeReplayRef.current = null;
    }
    setIsMazeReplaying(false);
    setMazePathIndex(mazeSubmission.path.length); // Show full path
  }, [mazeSubmission.path.length]);

  const getGameHtml = useCallback((gameCode: string) => {
    const winnerScript = `<script>window.winner = function() {};</script>`;
    if (gameCode.includes("<head>")) {
      return gameCode.replace("<head>", "<head>" + winnerScript);
    } else if (gameCode.includes("<HEAD>")) {
      return gameCode.replace("<HEAD>", "<HEAD>" + winnerScript);
    } else {
      return gameCode.replace(/<!DOCTYPE[^>]*>/i, (match) => match + winnerScript);
    }
  }, []);

  const handleVote = async () => {
    if (!isLoggedIn) return;
    setIsPending(true);
    try {
      const response = await fetch("/api/social/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.action === "added") {
          setLocalVotes([...localVotes, { userId: currentUserId! }]);
        } else {
          setLocalVotes(localVotes.filter((v) => v.userId !== currentUserId));
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isLoggedIn) return;

    try {
      const response = await fetch("/api/social/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          content: commentText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLocalComments([
          ...localComments,
          {
            id: result.comment.id,
            content: result.comment.content,
            user: { name: result.comment.userName },
          },
        ]);
        setCommentText("");
        router.refresh();
      }
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const challengeTitle = language === "es" ? submission.challenge.titleEs : submission.challenge.title;
  const challengeDescription = language === "es" ? submission.challenge.descriptionEs : submission.challenge.description;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-cursor-success";
    if (score >= 60) return "bg-yellow-500";
    return "bg-cursor-error";
  };

  const renderCardContent = () => {
    if (!submission.aiResponse) {
      return (
        <div className="p-3 flex-1 flex items-center justify-center text-cursor-text-muted italic">
          No output available
        </div>
      );
    }

    if (isImageOutput) {
      if (submission.challenge.targetImage) {
        return (
          <div className="grid grid-cols-2 gap-1 bg-cursor-bg-tertiary">
            <div className="relative aspect-square">
              <div className="absolute top-1 left-1 bg-black/70 text-cursor-text text-[10px] px-1.5 py-0.5 rounded z-10">
                {t.targetImage || "Target"}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={submission.challenge.targetImage} alt="Target reference" className="w-full h-full object-cover" />
            </div>
            <div className="relative aspect-square">
              <div className="absolute top-1 left-1 bg-cursor-accent/80 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
                {t.aiOutput}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={submission.aiResponse} alt={`AI generated for ${challengeTitle}`} className="w-full h-full object-cover" />
            </div>
          </div>
        );
      }
      return (
        <div className="relative aspect-[4/3] bg-cursor-bg-tertiary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={submission.aiResponse} alt={`AI generated for ${challengeTitle}`} className="w-full h-full object-cover" />
        </div>
      );
    }

    if (isGameOutput) {
      return (
        <div className="relative aspect-[4/3] bg-cursor-bg-tertiary">
          <div className="absolute top-1 left-1 bg-cursor-accent/80 text-white text-[10px] px-1.5 py-0.5 rounded z-10">🎮 Game</div>
          <iframe srcDoc={getGameHtml(submission.aiResponse)} className="w-full h-full" sandbox="allow-scripts" title="Game Preview" />
        </div>
      );
    }

    if (isMusicOutput && musicNotes.length > 0) {
      return (
        <div className="p-4 flex flex-col items-center justify-center gap-3 bg-cursor-bg-tertiary aspect-[4/3]">
          <div className="text-3xl">🎵</div>
          <div className="flex items-end gap-0.5 h-16">
            {musicNotes.slice(0, 20).map((note, index) => (
              <div
                key={index}
                className={`w-2 rounded-t transition-all duration-150 ${
                  index === currentNoteIndex ? "bg-cursor-accent scale-110" : index < currentNoteIndex ? "bg-cursor-success" : "bg-cursor-border"
                }`}
                style={{ height: `${Math.min(100, 20 + (noteToFrequency(note.pitch) / 15))}%` }}
              />
            ))}
            {musicNotes.length > 20 && <span className="text-xs text-cursor-text-muted ml-1">+{musicNotes.length - 20}</span>}
          </div>
          <p className="text-xs text-cursor-text-muted">{musicNotes.length} notes</p>
          <button
            onClick={(e) => { e.stopPropagation(); isPlaying ? stopMusic() : playMusic(); }}
            className="px-4 py-1.5 bg-cursor-accent text-white text-xs rounded-full hover:bg-cursor-accent-hover transition-colors flex items-center gap-1"
          >
            {isPlaying ? "■ Stop" : "▶ Play"}
          </button>
        </div>
      );
    }

    if (isMazeOutput) {
      if (mazeData) {
        const cellSize = Math.min(12, Math.floor(200 / mazeData[0].length));
        const path = mazeSubmission.path;
        const visiblePathIndex = mazePathIndex === -1 ? path.length : mazePathIndex;
        return (
          <div className="p-3 flex flex-col items-center justify-center gap-2 bg-cursor-bg-tertiary aspect-[4/3]">
            <div className="text-xl">🧩</div>
            <div className="grid gap-0 border border-cursor-border rounded overflow-hidden" style={{ gridTemplateColumns: `repeat(${mazeData[0]?.length || 15}, ${cellSize}px)` }}>
              {mazeData.map((row, y) =>
                row.map((cell, x) => {
                  const pathIndex = path.findIndex((p) => p.x === x && p.y === y);
                  const isOnPath = pathIndex !== -1 && pathIndex <= visiblePathIndex;
                  const isCurrentStep = pathIndex === visiblePathIndex && isMazeReplaying;
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`flex items-center justify-center transition-colors duration-100 ${
                        cell === "wall" ? "bg-cursor-text-muted" : cell === "start" ? "bg-blue-500" : cell === "end" ? "bg-yellow-500" : isCurrentStep ? "bg-cursor-accent" : isOnPath ? "bg-cursor-success" : "bg-cursor-bg-secondary"
                      }`}
                      style={{ width: cellSize, height: cellSize }}
                    >
                      {cell === "start" && <span className="text-[8px] text-white">S</span>}
                      {cell === "end" && <span className="text-[8px] text-black">E</span>}
                    </div>
                  );
                })
              )}
            </div>
            {path.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); isMazeReplaying ? stopMazeReplay() : replayMaze(); }}
                className="px-4 py-1.5 bg-cursor-accent text-white text-xs rounded-full hover:bg-cursor-accent-hover transition-colors flex items-center gap-1"
              >
                {isMazeReplaying ? "■ Stop" : "▶ Replay"}
              </button>
            )}
          </div>
        );
      }
      return (
        <div className="p-4 flex flex-col items-center justify-center gap-3 bg-cursor-bg-tertiary aspect-[4/3]">
          <div className="text-3xl">🧩</div>
          <p className="text-sm text-cursor-text font-medium">Maze Challenge</p>
          <p className="text-xs text-cursor-success">Solved successfully! ✓</p>
        </div>
      );
    }

    return (
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-cursor-text-muted mb-1 uppercase tracking-wider">{t.aiOutput}</div>
        <div className="bg-cursor-bg-tertiary p-3 rounded-lg text-sm font-mono text-cursor-text whitespace-pre-wrap break-words max-h-96 overflow-y-auto border border-cursor-border">
          {submission.aiResponse}
        </div>
      </div>
    );
  };

  const renderFullscreenContent = () => {
    if (!submission.aiResponse) {
      return <div className="p-6 flex items-center justify-center text-cursor-text-muted italic">No output available</div>;
    }

    if (isImageOutput) {
      if (submission.challenge.targetImage) {
        return (
          <div className="grid grid-cols-2 gap-4 bg-cursor-bg-tertiary p-4">
            <div className="flex flex-col items-center">
              <div className="text-sm font-semibold text-cursor-text-muted mb-2 uppercase tracking-wider">{t.targetImage || "Target"}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={submission.challenge.targetImage} alt="Target reference" className="max-w-full max-h-[50vh] object-contain rounded-lg" />
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-semibold text-cursor-accent mb-2 uppercase tracking-wider">{t.aiOutput}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={submission.aiResponse} alt={`AI generated for ${challengeTitle}`} className="max-w-full max-h-[50vh] object-contain rounded-lg" />
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center bg-cursor-bg-tertiary p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={submission.aiResponse} alt={`AI generated for ${challengeTitle}`} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
        </div>
      );
    }

    if (isGameOutput) {
      return (
        <div className="bg-cursor-bg-tertiary p-4">
          <div className="text-sm font-semibold text-cursor-accent mb-2 uppercase tracking-wider text-center">🎮 Playable Game</div>
          <iframe srcDoc={getGameHtml(submission.aiResponse)} className="w-full h-[60vh] rounded-lg border border-cursor-border" sandbox="allow-scripts" title="Game" />
        </div>
      );
    }

    if (isMusicOutput && musicNotes.length > 0) {
      return (
        <div className="p-6 flex flex-col items-center justify-center gap-6 bg-cursor-bg-tertiary">
          <div className="text-4xl">🎵</div>
          <div className="flex items-end gap-1 h-32 px-4 overflow-x-auto max-w-full">
            {musicNotes.map((note, index) => (
              <div
                key={index}
                className={`w-3 rounded-t transition-all duration-150 flex-shrink-0 ${
                  index === currentNoteIndex ? "bg-cursor-accent scale-110" : index < currentNoteIndex ? "bg-cursor-success" : "bg-cursor-border"
                }`}
                style={{ height: `${Math.min(100, 20 + (noteToFrequency(note.pitch) / 10))}%` }}
                title={note.pitch}
              />
            ))}
          </div>
          <p className="text-cursor-text font-medium">{musicNotes.length} notes ready to play</p>
          <div className="flex gap-4">
            {!isPlaying ? (
              <button onClick={playMusic} className="px-8 py-3 bg-cursor-accent text-white rounded-full font-semibold hover:bg-cursor-accent-hover transition-all flex items-center gap-2">
                <span>▶</span> Play Melody
              </button>
            ) : (
              <button onClick={stopMusic} className="px-8 py-3 bg-cursor-error text-white rounded-full font-semibold hover:bg-red-600 transition-all flex items-center gap-2">
                <span>■</span> Stop
              </button>
            )}
          </div>
        </div>
      );
    }

    if (isMazeOutput && mazeData) {
      const path = mazeSubmission.path;
      const visiblePathIndex = mazePathIndex === -1 ? path.length : mazePathIndex;
      return (
        <div className="p-6 flex flex-col items-center justify-center gap-4 bg-cursor-bg-tertiary">
          <div className="text-2xl">🧩 Maze Challenge</div>
          <div className="grid gap-0 border-2 border-cursor-border rounded-lg overflow-hidden" style={{ gridTemplateColumns: `repeat(${mazeData[0]?.length || 15}, 1fr)` }}>
            {mazeData.map((row, y) =>
              row.map((cell, x) => {
                const pathIndex = path.findIndex((p) => p.x === x && p.y === y);
                const isOnPath = pathIndex !== -1 && pathIndex <= visiblePathIndex;
                const isCurrentStep = pathIndex === visiblePathIndex && isMazeReplaying;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold transition-colors duration-100 ${
                      cell === "wall" ? "bg-cursor-text-muted" : cell === "start" ? "bg-blue-500" : cell === "end" ? "bg-yellow-500" : isCurrentStep ? "bg-cursor-accent" : isOnPath ? "bg-cursor-success" : "bg-cursor-bg-secondary"
                    }`}
                  >
                    {cell === "start" && <span className="text-white">S</span>}
                    {cell === "end" && <span className="text-black">E</span>}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-4 text-xs text-cursor-text-muted flex-wrap justify-center">
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-500 rounded" /> Start</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-yellow-500 rounded" /> Exit</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-cursor-text-muted rounded" /> Wall</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-cursor-success rounded" /> Path</div>
            {isMazeReplaying && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-cursor-accent rounded" /> Current</div>}
          </div>
          {path.length > 0 && (
            <div className="flex gap-4">
              {!isMazeReplaying ? (
                <button onClick={replayMaze} className="px-8 py-3 bg-cursor-accent text-white rounded-full font-semibold hover:bg-cursor-accent-hover transition-all flex items-center gap-2">
                  <span>▶</span> Replay Solution
                </button>
              ) : (
                <button onClick={stopMazeReplay} className="px-8 py-3 bg-cursor-error text-white rounded-full font-semibold hover:bg-red-600 transition-all flex items-center gap-2">
                  <span>■</span> Stop
                </button>
              )}
            </div>
          )}
          <p className="text-cursor-success font-medium">✓ Maze solved in {path.length} steps!</p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="text-sm font-semibold text-cursor-text-muted mb-2 uppercase tracking-wider">{t.aiOutput}</div>
        <div className="bg-cursor-bg-tertiary p-4 rounded-lg text-base font-mono text-cursor-text whitespace-pre-wrap break-words border border-cursor-border">
          {submission.aiResponse}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-cursor-bg-secondary rounded-xl border border-cursor-border overflow-hidden flex flex-col card-hover">
      {/* Header */}
      <div className="p-3 border-b border-cursor-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cursor-accent/20 flex items-center justify-center text-cursor-accent font-bold text-sm">
            {submission.challenge.day}
          </div>
          <div>
            <h3 className="font-semibold text-cursor-text text-sm">{challengeTitle}</h3>
            <p className="text-xs text-cursor-text-muted">{submission.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {submission.score > 0 && (
            <div className={`px-2 py-1 rounded-full text-white text-xs font-bold ${getScoreColor(submission.score)}`}>
              {submission.score}
            </div>
          )}
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg text-cursor-text-muted hover:text-cursor-text hover:bg-cursor-bg-tertiary transition-colors"
            title="Expand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">{renderCardContent()}</div>

      {/* Details section */}
      <div className="px-4 py-2 border-t border-cursor-border space-y-1">
        <details className="group">
          <summary className="text-xs text-cursor-text-muted cursor-pointer hover:text-cursor-text flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            {t.viewChallenge || "View challenge"}
          </summary>
          <div className="mt-2 bg-cursor-bg-tertiary p-2 rounded text-xs text-cursor-text max-h-32 overflow-y-auto whitespace-pre-wrap border border-cursor-border">
            {challengeDescription}
          </div>
        </details>
        <details className="group">
          <summary className="text-xs text-cursor-text-muted cursor-pointer hover:text-cursor-text flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            {t.viewPrompt || "View prompt"}
          </summary>
          <div className="mt-2 bg-cursor-bg-tertiary p-2 rounded text-xs font-mono text-cursor-text max-h-20 overflow-y-auto border border-cursor-border">
            {submission.userPrompt}
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-cursor-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleVote}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  hasVoted ? "bg-cursor-accent/20 text-cursor-accent" : "bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border hover:border-cursor-accent hover:text-cursor-accent"
                }`}
              >
                <span>{hasVoted ? "♥" : "♡"}</span>
                <span>{voteCount}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border">
                <span>♥</span>
                <span>{voteCount}</span>
              </div>
            )}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border hover:border-cursor-text-muted hover:text-cursor-text transition-colors"
            >
              <span>💬</span>
              <span>{localComments.length}</span>
            </button>
          </div>
          <div className="text-xs text-cursor-text-muted">
            {new Date(submission.createdAt).toLocaleDateString()}
          </div>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t border-cursor-border">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {localComments.length === 0 ? (
                <p className="text-xs text-cursor-text-muted italic">No comments yet</p>
              ) : (
                localComments.map((comment) => (
                  <div key={comment.id} className="text-xs">
                    <span className="font-bold text-cursor-accent">{comment.user.name}: </span>
                    <span className="text-cursor-text">{comment.content}</span>
                  </div>
                ))
              )}
            </div>
            {isLoggedIn && (
              <form onSubmit={handleComment} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t.addComment}
                  className="flex-1 bg-cursor-bg-tertiary border border-cursor-border rounded-md px-2 py-1 text-xs text-cursor-text focus:outline-none focus:border-cursor-accent placeholder:text-cursor-text-muted"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-2 py-1 bg-cursor-accent text-white text-xs rounded-md hover:bg-cursor-accent-hover disabled:opacity-50 transition-colors"
                >
                  {t.post}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal - rendered via Portal to avoid stacking context issues */}
      {isFullscreen && isMounted && createPortal(
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsFullscreen(false)}>
          <div className="relative bg-cursor-bg-secondary rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-cursor-border glow-purple" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-cursor-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cursor-accent/20 flex items-center justify-center text-cursor-accent font-bold">
                  {submission.challenge.day}
                </div>
                <div>
                  <h3 className="font-bold text-cursor-text text-lg">{challengeTitle}</h3>
                  <p className="text-sm text-cursor-text-muted">{submission.user.name} • {new Date(submission.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {submission.score > 0 && (
                  <div className={`px-3 py-1.5 rounded-full text-white text-sm font-bold ${getScoreColor(submission.score)}`}>{submission.score}</div>
                )}
                <button onClick={() => setIsFullscreen(false)} className="p-2 rounded-lg text-cursor-text-muted hover:text-cursor-text hover:bg-cursor-bg-tertiary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {renderFullscreenContent()}
              <div className="px-6 py-4 border-t border-cursor-border">
                <div className="text-sm font-semibold text-cursor-text-muted mb-2 uppercase tracking-wider">{t.viewChallenge}</div>
                <div className="bg-cursor-bg-tertiary p-4 rounded-lg text-sm text-cursor-text border border-cursor-border whitespace-pre-wrap">{challengeDescription}</div>
              </div>
              <div className="px-6 py-4 border-t border-cursor-border">
                <div className="text-sm font-semibold text-cursor-text-muted mb-2 uppercase tracking-wider">{t.viewPrompt}</div>
                <div className="bg-cursor-bg-tertiary p-4 rounded-lg text-sm font-mono text-cursor-text border border-cursor-border">{submission.userPrompt}</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-cursor-border flex items-center gap-4">
              {isLoggedIn ? (
                <button
                  onClick={handleVote}
                  disabled={isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    hasVoted ? "bg-cursor-accent/20 text-cursor-accent" : "bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border hover:border-cursor-accent hover:text-cursor-accent"
                  }`}
                >
                  <span className="text-lg">{hasVoted ? "♥" : "♡"}</span>
                  <span>{voteCount} {voteCount === 1 ? "like" : "likes"}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border">
                  <span className="text-lg">♥</span>
                  <span>{voteCount} {voteCount === 1 ? "like" : "likes"}</span>
                </div>
              )}
              <span className="text-cursor-text-muted">💬 {localComments.length} comments</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
