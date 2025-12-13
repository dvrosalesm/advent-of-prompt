import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import SubmissionCard from "./submission-card";
import { BackButton } from "./back-button";
import GalleryHeader from "./gallery-header";
import { EmptyStateClient } from "./empty-state";
import { getAllChallenges } from "@/lib/challenges";

export default async function GalleryPage() {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const staticChallenges = getAllChallenges();
  const challengeIds = staticChallenges.map((c) => c.id);

  const allSubmissions = await db.query.submissions.findMany({
    where: eq(submissions.isVerified, true),
    orderBy: [desc(submissions.createdAt)],
    with: {
      user: true,
      votes: true,
      comments: {
        with: {
          user: true,
        },
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
      },
    },
    limit: 50,
  });

  // Filter to only include submissions for challenges that exist in our static list
  // and map challenge data from static config
  const submissionsWithChallenges = allSubmissions
    .filter((sub) => challengeIds.includes(sub.challengeId))
    .map((sub) => {
      const challenge = staticChallenges.find((c) => c.id === sub.challengeId);
      return {
        ...sub,
        createdAt: sub.createdAt.toISOString(),
        challenge: challenge
          ? {
              day: challenge.day,
              title: challenge.title,
              titleEs: challenge.titleEs,
              outputType: challenge.outputType as string,
            }
          : { day: 0, title: "Unknown", titleEs: "Desconocido", outputType: "text" as string },
      };
    });

  return (
    <div className="min-h-screen font-sans text-christmas-green">
      <header className="h-16 border-b border-christmas-green/10 flex items-center px-6 bg-christmas-cream/80 backdrop-blur-md sticky top-0 z-10">
        <BackButton />
        <GalleryHeader />
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {submissionsWithChallenges.length === 0 ? (
          <div className="text-center py-12 text-christmas-green/60">
            <EmptyStateClient />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissionsWithChallenges.map((sub) => (
              <SubmissionCard key={sub.id} submission={sub} currentUserId={session.userId} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
