"use client";

import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

type LeaderboardEntry = {
  id: number;
  name: string | null;
  stats: {
    solved: number;
    likes: number;
    totalScore: number;
    avgScore: number;
    bonusPoints: number;
    score: number;
  };
};

export default function LeaderboardClient({ leaderboard, currentUserId }: { leaderboard: LeaderboardEntry[], currentUserId: number }) {
  const { t } = useLanguage();

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  const getScoreColor = (avgScore: number) => {
    if (avgScore >= 80) return "text-green-600";
    if (avgScore >= 60) return "text-yellow-600";
    return "text-christmas-red";
  };

  return (
    <div className="min-h-screen font-sans text-christmas-green">
      <header className="h-16 border-b border-christmas-green/10 flex items-center px-6 bg-christmas-cream/80 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="absolute text-christmas-green/70 hover:text-christmas-green flex items-center gap-2 transition-colors font-medium">
          ← {t.backToCalendar}
        </Link>
        <h1 className="ml-4 text-xl font-bold text-christmas-green w-full text-center">🏆 {t.leaderboard}</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">🥈</div>
              <div className="bg-white rounded-xl border-2 border-gray-300 p-4 text-center w-32">
                <div className="font-bold text-christmas-green truncate">{leaderboard[1]?.name}</div>
                <div className="text-2xl font-bold text-christmas-red">{leaderboard[1]?.stats.score}</div>
                <div className="text-xs text-christmas-green/60">{leaderboard[1]?.stats.solved} solved</div>
              </div>
              <div className="h-16 w-24 bg-gray-200 rounded-t-lg mt-2" />
            </div>
            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-8">
              <div className="text-5xl mb-2 animate-bounce">🥇</div>
              <div className="bg-white rounded-xl border-2 border-yellow-400 p-4 text-center w-36 shadow-lg shadow-yellow-100">
                <div className="font-bold text-christmas-green truncate">{leaderboard[0]?.name}</div>
                <div className="text-3xl font-bold text-christmas-red">{leaderboard[0]?.stats.score}</div>
                <div className="text-xs text-christmas-green/60">{leaderboard[0]?.stats.solved} solved</div>
              </div>
              <div className="h-24 w-28 bg-yellow-100 rounded-t-lg mt-2" />
            </div>
            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">🥉</div>
              <div className="bg-white rounded-xl border-2 border-orange-300 p-4 text-center w-32">
                <div className="font-bold text-christmas-green truncate">{leaderboard[2]?.name}</div>
                <div className="text-2xl font-bold text-christmas-red">{leaderboard[2]?.stats.score}</div>
                <div className="text-xs text-christmas-green/60">{leaderboard[2]?.stats.solved} solved</div>
              </div>
              <div className="h-12 w-24 bg-orange-100 rounded-t-lg mt-2" />
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-white rounded-xl border border-christmas-green/20 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-christmas-cream/50 text-christmas-green/70 border-b border-christmas-green/10">
              <tr>
                <th className="px-4 py-3 font-medium">{t.rank}</th>
                <th className="px-4 py-3 font-medium">{t.hacker}</th>
                <th className="px-4 py-3 font-medium text-center">{t.solved}</th>
                <th className="px-4 py-3 font-medium text-center">Avg</th>
                <th className="px-4 py-3 font-medium text-center">{t.likes}</th>
                <th className="px-4 py-3 font-medium text-right">{t.score}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-christmas-green/10">
              {leaderboard.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-christmas-green/5 transition-colors ${
                    user.id === currentUserId ? "bg-christmas-red/5 border-l-4 border-l-christmas-red" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-christmas-green/60">
                    <span className="flex items-center gap-2">
                      {getRankEmoji(index) || `#${index + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-christmas-green">
                    {user.name}
                    {user.id === currentUserId && <span className="ml-2 text-xs text-christmas-red">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-christmas-green/10 text-christmas-green px-2 py-0.5 rounded-full text-xs font-medium">
                      {user.stats.solved}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center font-medium ${getScoreColor(user.stats.avgScore)}`}>
                    {user.stats.avgScore > 0 ? `${user.stats.avgScore}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-christmas-green/80">
                    <span className="flex items-center justify-center gap-1">
                      ♥ {user.stats.likes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-christmas-red text-lg">{user.stats.score}</div>
                    {user.stats.bonusPoints > 0 && (
                      <div className="text-xs text-christmas-green/50">+{user.stats.bonusPoints} bonus</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scoring explanation */}
        <div className="mt-6 p-4 bg-white/50 rounded-xl border border-christmas-green/10 text-sm text-christmas-green/70">
          <h3 className="font-bold text-christmas-green mb-2">📊 How scoring works:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Each completed challenge gives you 0-100 points based on your result</li>
            <li>Each ♥ like on your submissions gives +5 bonus points</li>
            <li>Total Score = Sum of all challenge scores + bonus points</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
