"use client";

import { useState, useTransition } from "react";
import { submitChallenge } from "@/app/actions/challenge";
import { useLanguage } from "@/components/language-provider";

type Challenge = {
  id: number;
  day: number;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  difficulty: string;
  difficultyEs: string;
};

export default function ChallengeClient({ challenge }: { challenge: Challenge }) {
  const { t, language } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        setIsVerified(null);
        setReasoning("");
        setOutput(t.processing);
        const result = await submitChallenge(challenge.id, prompt);
        setOutput(result.aiOutput);
        setIsVerified(result.isVerified);
        setReasoning(result.reasoning);
      } catch (error) {
        setOutput("Error: " + (error instanceof Error ? error.message : String(error)));
        setIsVerified(false);
      }
    });
  };

  const title = language === "es" ? challenge.titleEs : challenge.title;
  const description = language === "es" ? challenge.descriptionEs : challenge.description;
  const difficulty = language === "es" ? challenge.difficultyEs : challenge.difficulty;

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

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-christmas-green/20 overflow-hidden">
          <div className="p-3 bg-christmas-cream border-b border-christmas-green/10 flex items-center justify-between">
            <span className="text-sm font-medium text-christmas-green">{t.yourPrompt}</span>
          </div>
          <textarea
            className="flex-1 bg-white p-4 resize-none focus:outline-none text-christmas-green font-mono text-sm placeholder:text-christmas-green/30"
            placeholder="Enter your prompt here..."
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
              {isPending ? t.processing : t.runVerify}
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
            <span className="text-sm font-medium text-christmas-green">{t.aiOutput}</span>
            {isVerified !== null && (
              <span className={`text-sm font-bold ${isVerified ? "text-green-700" : "text-christmas-red"}`}>
                {isVerified ? `✓ ${t.success}` : `✗ ${t.failed}`}
              </span>
            )}
          </div>
          <div className="flex-1 p-6 overflow-auto font-mono text-sm whitespace-pre-wrap text-christmas-green/90">
            {output || <span className="text-christmas-green/40 italic">...</span>}
          </div>
        </div>

        {reasoning && (
          <div className="bg-white p-4 rounded-xl border border-christmas-green/20 shadow-sm">
            <h3 className="text-sm font-medium text-christmas-green/70 mb-2">{t.judgesFeedback}</h3>
            <p className="text-sm text-christmas-green">{reasoning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
