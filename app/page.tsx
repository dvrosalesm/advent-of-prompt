import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import HomeClient from "./client-page";
import { getAllChallenges } from "@/lib/challenges";

export default async function Home() {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const allChallenges = getAllChallenges();
  const challengeIds = allChallenges.map((c) => c.id);

  // Get verified submissions for challenges that exist in our static list
  const userSubmissions = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, session.userId),
        eq(submissions.isVerified, true),
        inArray(submissions.challengeId, challengeIds)
      )
    )
    .all();

  const completedChallengeIds = new Set(userSubmissions.map((s) => s.challengeId));

  return (
    <HomeClient
      sessionName={session.name}
      allChallenges={allChallenges}
      completedChallengeIds={completedChallengeIds}
    />
  );
}
