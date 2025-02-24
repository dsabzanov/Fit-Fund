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

// Weight records table
export const weightRecords = pgTable("weight_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  weight: numeric("weight").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
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

export const insertChallengeSchema = createInsertSchema(challenges);
export const insertParticipantSchema = createInsertSchema(participants);
export const insertWeightRecordSchema = createInsertSchema(weightRecords);
export const insertChatMessageSchema = createInsertSchema(chatMessages);

// Export types
export type User = typeof users.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type WeightRecord = typeof weightRecords.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertWeightRecord = z.infer<typeof insertWeightRecordSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
