import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, desc, lt, and } from "drizzle-orm";
import { getAllChallenges } from "@/lib/challenges";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  // Session is optional - gallery is public
  const session = await verifySession();

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");

  const staticChallenges = getAllChallenges();
  const challengeIds = staticChallenges.map((c) => c.id);

  const whereConditions = cursor
    ? and(eq(submissions.isVerified, true), lt(submissions.id, parseInt(cursor)))
    : eq(submissions.isVerified, true);

  const allSubmissions = await db.query.submissions.findMany({
    where: whereConditions,
    orderBy: [desc(submissions.id)],
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
    limit: PAGE_SIZE + 1,
  });

  const hasMore = allSubmissions.length > PAGE_SIZE;
  const submissionsToReturn = hasMore ? allSubmissions.slice(0, PAGE_SIZE) : allSubmissions;

  const submissionsWithChallenges = submissionsToReturn
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
              description: challenge.description,
              descriptionEs: challenge.descriptionEs,
              outputType: challenge.outputType as string,
              targetImage: challenge.targetImage || null,
            }
          : { day: 0, title: "Unknown", titleEs: "Desconocido", description: "", descriptionEs: "", outputType: "text" as string, targetImage: null },
      };
    });

  const nextCursor = hasMore && submissionsToReturn.length > 0
    ? submissionsToReturn[submissionsToReturn.length - 1].id.toString()
    : null;

  return NextResponse.json({
    submissions: submissionsWithChallenges,
    nextCursor,
    currentUserId: session?.userId || null,
  });
}
