import { verifySession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ChallengeClient from "./client";
import Link from "next/link";
import { BackButton } from "./back-button";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const { day } = await params;
  const dayNum = parseInt(day);

  if (isNaN(dayNum)) {
    notFound();
  }

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.day, dayNum),
  });

  if (!challenge) {
    notFound();
  }

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <header className="h-16 border-b border-christmas-green/10 flex items-center px-6 bg-christmas-cream/80 backdrop-blur-md">
        <BackButton />
      </header>
      <ChallengeClient challenge={challenge} />
    </div>
  );
}
