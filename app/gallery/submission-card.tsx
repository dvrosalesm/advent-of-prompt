"use client";

import { useState } from "react";
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isImageOutput && submission.aiResponse ? (
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.aiResponse}
              alt={`AI generated for ${challengeTitle}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="p-4">
            <div className="text-xs font-semibold text-christmas-green/60 mb-1 uppercase tracking-wider">{t.aiOutput}</div>
            <div className="bg-christmas-green/5 p-3 rounded-lg text-sm font-mono text-christmas-green/80 whitespace-pre-wrap break-words max-h-32 overflow-y-auto border border-christmas-green/5">
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                hasVoted
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
    </div>
  );
}
