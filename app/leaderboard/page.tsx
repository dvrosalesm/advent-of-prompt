import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import LeaderboardClient from "./client";

export default async function LeaderboardPage() {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  // Fetch all users with their verified submissions and votes on those submissions
  const usersData = await db.query.users.findMany({
    with: {
      submissions: {
        where: (submissions, { eq }) => eq(submissions.isVerified, true),
        with: {
          votes: true,
        },
      },
    },
  });

  // Calculate scores - now using actual submission scores
  const leaderboard = usersData
    .map((user) => {
      // Sum of all submission scores (0-100 each)
      const challengePoints = user.submissions.reduce(
        (acc, sub) => acc + (sub.score || 0),
        0
      );
      // Bonus points for votes received
      const votePoints = user.submissions.reduce(
        (acc, sub) => acc + sub.votes.length * 5,
        0
      );
      // Average score per challenge
      const avgScore = user.submissions.length > 0
        ? Math.round(challengePoints / user.submissions.length)
        : 0;
      
      return {
        ...user,
        stats: {
          solved: user.submissions.length,
          likes: user.submissions.reduce((acc, sub) => acc + sub.votes.length, 0),
          totalScore: challengePoints,
          avgScore,
          bonusPoints: votePoints,
          score: challengePoints + votePoints, // Total score
        },
      };
    })
    .sort((a, b) => b.stats.score - a.stats.score);

  return <LeaderboardClient leaderboard={leaderboard} currentUserId={session.userId} />;
}
