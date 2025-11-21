import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import SubmissionCard from "./submission-card";
import { BackButton } from "./back-button";
import GalleryHeader from "./gallery-header";
import { EmptyStateClient } from "./empty-state";

export default async function GalleryPage() {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const allSubmissions = await db.query.submissions.findMany({
    where: eq(submissions.isVerified, true),
    orderBy: [desc(submissions.createdAt)],
    with: {
      user: true,
      challenge: true,
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

  return (
    <div className="min-h-screen font-sans text-christmas-green">
      <header className="h-16 border-b border-christmas-green/10 flex items-center px-6 bg-christmas-cream/80 backdrop-blur-md sticky top-0 z-10">
        <BackButton />
        <GalleryHeader />
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {allSubmissions.length === 0 ? (
           <div className="text-center py-12 text-christmas-green/60">
             <EmptyStateClient />
           </div>
        ) : (
          allSubmissions.map((sub) => (
            <SubmissionCard key={sub.id} submission={sub} currentUserId={session.userId} />
          ))
        )}
      </main>
    </div>
  );
}
