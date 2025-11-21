"use client";

import { useLanguage } from "@/components/language-provider";
import Link from "next/link";

type LeaderboardEntry = {
  id: number;
  name: string | null;
  stats: {
    solved: number;
    likes: number;
    score: number;
  };
};

export default function LeaderboardClient({ leaderboard, currentUserId }: { leaderboard: LeaderboardEntry[], currentUserId: number }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen font-sans text-christmas-green">
      <header className="h-16 border-b border-christmas-green/10 flex items-center px-6 bg-christmas-cream/80 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="absolute text-christmas-green/70 hover:text-christmas-green flex items-center gap-2 transition-colors font-medium">
          ← {t.backToCalendar}
        </Link>
        <h1 className="ml-4 text-xl font-bold text-christmas-green w-full text-center">{t.leaderboard}</h1>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-christmas-green/20 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-christmas-cream/50 text-christmas-green/70 border-b border-christmas-green/10">
              <tr>
                <th className="px-6 py-4 font-medium">{t.rank}</th>
                <th className="px-6 py-4 font-medium">{t.hacker}</th>
                <th className="px-6 py-4 font-medium text-right">{t.solved}</th>
                <th className="px-6 py-4 font-medium text-right">{t.likes}</th>
                <th className="px-6 py-4 font-medium text-right">{t.score}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-christmas-green/10">
              {leaderboard.map((user, index) => (
                <tr key={user.id} className={`hover:bg-christmas-green/5 transition-colors ${user.id === currentUserId ? "bg-christmas-red/5" : ""}`}>
                  <td className="px-6 py-4 font-mono text-christmas-green/60">#{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-christmas-green flex items-center gap-2">
                    {user.name}
                    {index === 0 && <span className="text-yellow-600 drop-shadow-sm">👑</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-christmas-green/80">{user.stats.solved}</td>
                  <td className="px-6 py-4 text-right text-christmas-green/80">{user.stats.likes}</td>
                  <td className="px-6 py-4 text-right font-bold text-christmas-red">{user.stats.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
