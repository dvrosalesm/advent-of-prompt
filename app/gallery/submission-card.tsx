"use client";

import { useState, useTransition } from "react";
import { toggleVote, addComment } from "@/app/actions/social";
import { useLanguage } from "@/components/language-provider";

type SubmissionCardProps = {
  submission: {
    id: number;
    userPrompt: string;
    aiResponse: string | null;
    createdAt: string;
    user: { name: string | null };
    challenge: { day: number; title: string; titleEs: string };
    votes: { userId: number }[];
    comments: { id: number; content: string; user: { name: string | null } }[];
  };
  currentUserId: number;
};

export default function SubmissionCard({ submission, currentUserId }: SubmissionCardProps) {
  const { t, language } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [commentText, setCommentText] = useState("");

  const hasVoted = submission.votes.some((v) => v.userId === currentUserId);
  const voteCount = submission.votes.length;

  const handleVote = () => {
    startTransition(async () => {
      await toggleVote(submission.id);
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    await addComment(submission.id, commentText);
    setCommentText("");
  };

  const challengeTitle = language === "es" ? submission.challenge.titleEs : submission.challenge.title;

  return (
    <div className="bg-white rounded-xl border border-christmas-green/20 overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 border-b border-christmas-green/10 flex justify-between items-start bg-christmas-cream/30">
        <div>
          <h3 className="font-bold text-christmas-green">{t.day} {submission.challenge.day}: {challengeTitle}</h3>
          <p className="text-sm text-christmas-green/70">{t.by} {submission.user.name}</p>
        </div>
        <div className="text-xs text-christmas-green/50">
          {new Date(submission.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div>
          <div className="text-xs font-semibold text-christmas-green/60 mb-1 uppercase tracking-wider">{t.yourPrompt}</div>
          <div className="bg-christmas-cream/50 p-3 rounded-lg text-sm font-mono text-christmas-green whitespace-pre-wrap break-words border border-christmas-green/5">
            {submission.userPrompt}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-christmas-green/60 mb-1 uppercase tracking-wider">{t.aiOutput}</div>
          <div className="bg-christmas-green/5 p-3 rounded-lg text-sm font-mono text-christmas-green/80 whitespace-pre-wrap break-words max-h-40 overflow-y-auto border border-christmas-green/5">
            {submission.aiResponse}
          </div>
        </div>
      </div>

      <div className="bg-christmas-cream/50 p-4 border-t border-christmas-green/10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleVote}
            disabled={isPending}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              hasVoted
                ? "bg-christmas-red/10 text-christmas-red hover:bg-christmas-red/20"
                : "bg-white text-christmas-green/60 border border-christmas-green/20 hover:border-christmas-red hover:text-christmas-red"
            }`}
          >
            <span>{hasVoted ? `♥ ${t.liked}` : `♡ ${t.like}`}</span>
            <span>{voteCount}</span>
          </button>
        </div>

        <div className="space-y-3">
          {submission.comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <span className="font-bold text-christmas-green">{comment.user.name}: </span>
              <span className="text-christmas-green/80">{comment.content}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleComment} className="mt-4 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t.addComment}
            className="flex-1 bg-white border border-christmas-green/20 rounded-md px-3 py-1.5 text-sm text-christmas-green focus:outline-none focus:border-christmas-green/50 placeholder:text-christmas-green/30"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-3 py-1.5 bg-christmas-green text-white text-sm rounded-md hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {t.post}
          </button>
        </form>
      </div>
    </div>
  );
}
