"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, deleteSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  if (!email || !name) {
    return { error: "Email and Name are required" };
  }

  // Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({ email, name })
      .returning();
    user = newUser;
  }

  await createSession(user.id, user.email, user.name || "");
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

