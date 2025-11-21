import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { challenges, submissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import HomeClient from "./client-page";

export default async function Home() {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const allChallenges = await db.select().from(challenges).all();
  const userSubmissions = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, session.userId),
        eq(submissions.isVerified, true)
      )
    )
    .all();

  const completedChallengeIds = new Set(userSubmissions.map((s) => s.challengeId));

  return <HomeClient sessionName={session.name} allChallenges={allChallenges} completedChallengeIds={completedChallengeIds} />;
}
