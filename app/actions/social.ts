"use server";

import { db } from "@/lib/db";
import { votes, comments } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function toggleVote(submissionId: number) {
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const existingVote = await db.query.votes.findFirst({
    where: and(
      eq(votes.submissionId, submissionId),
      eq(votes.userId, session.userId)
    ),
  });

  if (existingVote) {
    await db.delete(votes).where(eq(votes.id, existingVote.id));
  } else {
    await db.insert(votes).values({
      userId: session.userId,
      submissionId,
    });
  }

  revalidatePath("/gallery");
}

export async function addComment(submissionId: number, content: string) {
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  if (!content.trim()) return;

  await db.insert(comments).values({
    userId: session.userId,
    submissionId,
    content,
  });

  revalidatePath("/gallery");
}

