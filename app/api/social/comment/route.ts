import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, content } = body;

    if (!submissionId || !content?.trim()) {
      return NextResponse.json(
        { error: "Submission ID and content are required" },
        { status: 400 }
      );
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        userId: session.userId,
        submissionId,
        content,
      })
      .returning();

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        content: newComment.content,
        userName: session.name,
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "An error occurred while adding comment" },
      { status: 500 }
    );
  }
}

