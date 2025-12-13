"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

type SubmissionCardProps = {
  submission: {
    id: number;
    userPrompt: string;
    aiResponse: string | null;
    outputType: string;
    score: number;
    createdAt: string;
    user: { name: string | null };
    challenge: { day: number; title: string; titleEs: string; outputType: string };
    votes: { userId: number }[];
    comments: { id: number; content: string; user: { name: string | null } }[];
  };
  currentUserId: number;
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

  // Handle escape key to close fullscreen
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

  const hasVoted = localVotes.some((v) => v.userId === currentUserId);
  const voteCount = localVotes.length;
  const isImageOutput = submission.outputType === "image" || submission.challenge.outputType === "image";

  const handleVote = async () => {
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
          setLocalVotes([...localVotes, { userId: currentUserId }]);
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
    if (!commentText.trim()) return;

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-xl border border-christmas-green/20 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-3 border-b border-christmas-green/10 flex justify-between items-center bg-christmas-cream/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎄</span>
          <div>
            <h3 className="font-bold text-christmas-green text-sm">{t.day} {submission.challenge.day}</h3>
            <p className="text-xs text-christmas-green/60">{submission.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {submission.score > 0 && (
            <div className={`px-2 py-1 rounded-full text-white text-xs font-bold ${getScoreColor(submission.score)}`}>
              {submission.score}pts
            </div>
          )}
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg text-christmas-green/60 hover:text-christmas-green hover:bg-christmas-green/10 transition-colors"
            title="Expand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {isImageOutput && submission.aiResponse ? (
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.aiResponse}
              alt={`AI generated for ${challengeTitle}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="p-3 flex-1 flex flex-col">
            <div className="text-xs font-semibold text-christmas-green/60 mb-1 uppercase tracking-wider">{t.aiOutput}</div>
            <div className="bg-christmas-green/5 p-3 rounded-lg text-sm font-mono text-christmas-green/80 whitespace-pre-wrap break-words max-h-96 overflow-y-auto border border-christmas-green/5">
              {submission.aiResponse}
            </div>
          </div>
        )}
      </div>

      {/* Prompt preview (collapsed) */}
      <div className="px-4 py-2 border-t border-christmas-green/10 bg-christmas-cream/20">
        <details className="group">
          <summary className="text-xs text-christmas-green/60 cursor-pointer hover:text-christmas-green flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            View prompt
          </summary>
          <div className="mt-2 bg-white p-2 rounded text-xs font-mono text-christmas-green/80 max-h-20 overflow-y-auto">
            {submission.userPrompt}
          </div>
        </details>
      </div>

      {/* Footer with interactions */}
      <div className="bg-christmas-cream/50 p-3 border-t border-christmas-green/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleVote}
              disabled={isPending}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${hasVoted
                ? "bg-christmas-red/10 text-christmas-red hover:bg-christmas-red/20"
                : "bg-white text-christmas-green/60 border border-christmas-green/20 hover:border-christmas-red hover:text-christmas-red"
                }`}
            >
              <span>{hasVoted ? "♥" : "♡"}</span>
              <span>{voteCount}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-white text-christmas-green/60 border border-christmas-green/20 hover:border-christmas-green hover:text-christmas-green transition-colors"
            >
              <span>💬</span>
              <span>{localComments.length}</span>
            </button>
          </div>
          <div className="text-xs text-christmas-green/40">
            {new Date(submission.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-christmas-green/10">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {localComments.map((comment) => (
                <div key={comment.id} className="text-xs">
                  <span className="font-bold text-christmas-green">{comment.user.name}: </span>
                  <span className="text-christmas-green/80">{comment.content}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} className="mt-2 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.addComment}
                className="flex-1 bg-white border border-christmas-green/20 rounded-md px-2 py-1 text-xs text-christmas-green focus:outline-none focus:border-christmas-green/50 placeholder:text-christmas-green/30"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-2 py-1 bg-christmas-green text-white text-xs rounded-md hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {t.post}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fullscreen Header */}
            <div className="p-4 border-b border-christmas-green/10 flex justify-between items-center bg-christmas-cream/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎄</span>
                <div>
                  <h3 className="font-bold text-christmas-green text-lg">{t.day} {submission.challenge.day}: {challengeTitle}</h3>
                  <p className="text-sm text-christmas-green/60">{submission.user.name} • {new Date(submission.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {submission.score > 0 && (
                  <div className={`px-3 py-1.5 rounded-full text-white text-sm font-bold ${getScoreColor(submission.score)}`}>
                    {submission.score}pts
                  </div>
                )}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-lg text-christmas-green/60 hover:text-christmas-green hover:bg-christmas-green/10 transition-colors"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Fullscreen Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {isImageOutput && submission.aiResponse ? (
                <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submission.aiResponse}
                    alt={`AI generated for ${challengeTitle}`}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-sm font-semibold text-christmas-green/60 mb-2 uppercase tracking-wider">{t.aiOutput}</div>
                  <div className="bg-christmas-green/5 p-4 rounded-lg text-base font-mono text-christmas-green/80 whitespace-pre-wrap break-words border border-christmas-green/10">
                    {submission.aiResponse}
                  </div>
                </div>
              )}

              {/* Prompt Section */}
              <div className="px-6 py-4 border-t border-christmas-green/10 bg-christmas-cream/20">
                <div className="text-sm font-semibold text-christmas-green/60 mb-2 uppercase tracking-wider">Prompt</div>
                <div className="bg-white p-4 rounded-lg text-sm font-mono text-christmas-green/80 border border-christmas-green/10">
                  {submission.userPrompt}
                </div>
              </div>
            </div>

            {/* Fullscreen Footer */}
            <div className="p-4 border-t border-christmas-green/10 bg-christmas-cream/50 flex items-center gap-4">
              <button
                onClick={handleVote}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${hasVoted
                  ? "bg-christmas-red/10 text-christmas-red hover:bg-christmas-red/20"
                  : "bg-white text-christmas-green/60 border border-christmas-green/20 hover:border-christmas-red hover:text-christmas-red"
                  }`}
              >
                <span className="text-lg">{hasVoted ? "♥" : "♡"}</span>
                <span>{voteCount} {voteCount === 1 ? "like" : "likes"}</span>
              </button>
              <span className="text-christmas-green/40">💬 {localComments.length} comments</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
