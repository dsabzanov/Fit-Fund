import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  currentWeight: numeric("current_weight"),
  targetWeight: numeric("target_weight"),
});

// Challenges table
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  entryFee: integer("entry_fee").notNull(),
  percentageGoal: numeric("percentage_goal").notNull(),
  status: text("status").notNull(), // 'open', 'in-progress', 'completed'
});

// Participants table (joins users and challenges)
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  startWeight: numeric("start_weight").notNull(),
  currentWeight: numeric("current_weight").notNull(),
  paid: boolean("paid").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Weight records table with image verification
export const weightRecords = pgTable("weight_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  weight: numeric("weight").notNull(),
  imageUrl: text("image_url"), // Optional image URL for verification
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

// Feed posts table
export const feedPosts = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // Optional image URL
  isPinned: boolean("is_pinned").notNull().default(false),
  isScheduled: boolean("is_scheduled").notNull().default(false),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChallengeSchema = createInsertSchema(challenges)
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    entryFee: z.coerce.number(),
    percentageGoal: z.coerce.number()
  });
export const insertParticipantSchema = createInsertSchema(participants)
  .extend({
    startWeight: z.number().or(z.string()).transform(val => {
      const num = typeof val === 'string' ? Number(val) : val;
      if (isNaN(num) || num <= 0) {
        throw new Error("Weight must be a positive number");
      }
      return num;
    }),
    challengeId: z.number(),
  })
  .omit({ 
    id: true,
    currentWeight: true,
    paid: true,
    joinedAt: true 
  });
export const insertWeightRecordSchema = createInsertSchema(weightRecords)
  .extend({
    weight: z.string().min(1, "Weight is required"),
    imageUrl: z.string().url("Please enter a valid image URL").nullable(),
    recordedAt: z.coerce.date().optional(),
  });
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertFeedPostSchema = createInsertSchema(feedPosts);
export const insertCommentSchema = createInsertSchema(comments);

// Export types
export type User = typeof users.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type WeightRecord = typeof weightRecords.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type FeedPost = typeof feedPosts.$inferSelect;
export type Comment = typeof comments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertWeightRecord = z.infer<typeof insertWeightRecordSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;