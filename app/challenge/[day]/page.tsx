import { verifySession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import ChallengeClient from "./client";
import { BackButton } from "./back-button";
import { getChallengeByDay } from "@/lib/challenges";

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

  const challenge = getChallengeByDay(dayNum);

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
