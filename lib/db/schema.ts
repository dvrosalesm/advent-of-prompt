import { sql, relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
  votes: many(votes),
  comments: many(comments),
}));

export const challenges = sqliteTable("challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  day: integer("day").notNull().unique(),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull().default(""),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull().default(""),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  difficultyEs: text("difficulty_es").notNull().default("Fácil"),
  validationLogic: text("validation_logic").notNull(), // System prompt for validation
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const challengesRelations = relations(challenges, ({ many }) => ({
  submissions: many(submissions),
}));

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenges.id),
  userPrompt: text("user_prompt").notNull(),
  aiResponse: text("ai_response"),
  outputType: text("output_type").default("text").notNull(), // 'text' or 'image'
  score: integer("score").default(0).notNull(), // 0-100 score for the submission
  isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
  votes: many(votes),
  comments: many(comments),
}));

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => submissions.id),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  submission: one(submissions, {
    fields: [votes.submissionId],
    references: [submissions.id],
  }),
}));

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => submissions.id),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  submission: one(submissions, {
    fields: [comments.submissionId],
    references: [submissions.id],
  }),
}));
