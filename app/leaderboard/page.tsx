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

  // Calculate scores
  const leaderboard = usersData
    .map((user) => {
      const challengePoints = user.submissions.length * 100;
      const votePoints = user.submissions.reduce(
        (acc, sub) => acc + sub.votes.length * 10,
        0
      );
      return {
        ...user,
        stats: {
          solved: user.submissions.length,
          likes: user.submissions.reduce((acc, sub) => acc + sub.votes.length, 0),
          score: challengePoints + votePoints,
        },
      };
    })
    .sort((a, b) => b.stats.score - a.stats.score);

  return <LeaderboardClient leaderboard={leaderboard} currentUserId={session.userId} />;
}
