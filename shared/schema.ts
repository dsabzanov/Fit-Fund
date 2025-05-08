export interface IStorage {
  sessionStore: any;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllChallenges(): Promise<Challenge[]>;
  getUserChallenges(userId: number): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  getChallengeIfParticipant(id: number, userId: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getParticipant(userId: number, challengeId: number): Promise<Participant | undefined>;
  addParticipant(data: { userId: number; challengeId: number; startWeight: number }): Promise<Participant>;
  getParticipants(challengeId: number): Promise<Participant[]>;
  
  // Weight record methods
  addWeightRecord(record: InsertWeightRecord): Promise<WeightRecord>;
  getWeightRecords(userId: number, challengeId: number): Promise<WeightRecord[]>;
  getUserWeightRecords(userId: number): Promise<WeightRecord[]>;
  getPendingWeightRecords(): Promise<WeightRecord[]>;
  updateWeightRecordVerification(recordId: number, status: string, feedback?: string): Promise<WeightRecord | undefined>;
  
  // Chat message methods
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(challengeId: number): Promise<ChatMessage[]>;
  updateChatMessagePinStatus(messageId: number, isPinned: boolean): Promise<ChatMessage | undefined>;
  deleteChatMessage(messageId: number): Promise<void>;
  
  // Feed post methods
  createFeedPost(post: InsertFeedPost): Promise<FeedPost>;
  getPostsByChallenge(challengeId: number): Promise<FeedPost[]>;
  updateFeedPost(id: number, updates: Partial<FeedPost>): Promise<FeedPost | undefined>;
  
  // Comment methods
  addComment(comment: InsertComment): Promise<Comment>;
  getComments(postId: number): Promise<Comment[]>;
  
  // Other methods
  getFeedPosts(challengeId: number): Promise<FeedPost[]>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined>;
  getAllParticipants(): Promise<Participant[]>;
  updateParticipantPaymentStatus(challengeId: number, userId: number, paid: boolean): Promise<void>;
}

import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  currentWeight: numeric("current_weight"),
  targetWeight: numeric("target_weight"),
  isHost: boolean("is_host").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  stripeConnectAccountId: text("stripe_connect_account_id"), // Stripe Connect Express account ID
  stripeConnectOnboardingComplete: boolean("stripe_connect_onboarding_complete").default(false), // Tracks onboarding status
  stripeCustomerId: text("stripe_customer_id"), // Regular Stripe customer ID
  createdAt: timestamp("created_at").defaultNow(),
  onboardingComplete: boolean("onboarding_complete").default(false), // Added to track if user has completed onboarding
});

// Challenges table
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Host user ID
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
  verificationStatus: text("verification_status").default("pending"), // Status of verification (pending, approved, rejected)
  verificationFeedback: text("verification_feedback"), // Admin feedback on verification
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
  isPinned: boolean("is_pinned").notNull().default(false),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    email: z.string().email("Invalid email address").nullable().optional(),
    isHost: z.boolean().default(false).optional(),
    isAdmin: z.boolean().default(false).optional(),
    currentWeight: z.string().nullable().optional(),
    targetWeight: z.string().nullable().optional(),
    stripeConnectAccountId: z.string().optional(),
    stripeConnectOnboardingComplete: z.boolean().default(false).optional(),
    stripeCustomerId: z.string().optional(),
    createdAt: z.date().optional(),
    onboardingComplete: z.boolean().default(false).optional(),
  });

export const insertChallengeSchema = createInsertSchema(challenges)
  .extend({
    startDate: z.coerce.date()
      .refine(date => {
        try {
          if (!(date instanceof Date) || isNaN(date.getTime())) {
            return false;
          }
          // Allow today's date as the start date (comparing just the date portion)
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startDateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          return startDateDay >= today;
        } catch (error) {
          console.error("Date validation error:", error);
          return false;
        }
      }, {
        message: "Start date must be today or in the future"
      }),
    endDate: z.coerce.date()
      .refine(date => {
        return date instanceof Date && !isNaN(date.getTime());
      }, {
        message: "End date must be a valid date"
      }),
    entryFee: z.coerce.number()
      .min(10, "Entry fee must be at least $10")
      .max(1000, "Entry fee cannot exceed $1000"),
    percentageGoal: z.coerce.number()
      .min(1, "Weight loss goal must be at least 1%")
      .max(10, "Weight loss goal cannot exceed 10%"),
    userId: z.number().optional() // Make userId optional as it will be filled by the server
  })
  .refine(data => {
    try {
      // Parse dates safely
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }

      // Cross-validate start date and end date - end date must be after start date
      return endDate > startDate;
    } catch (error) {
      console.error("Date comparison error:", error);
      return false;
    }
  }, {
    message: "End date must be after start date",
    path: ["endDate"] // Show error on the end date field
  });
export const insertParticipantSchema = createInsertSchema(participants)
  .omit({ 
    id: true,
    currentWeight: true,
    paid: true,
    joinedAt: true 
  })
  .extend({
    startWeight: z.string().min(1, "Weight is required").transform(val => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("Weight must be a positive number");
      }
      return num;
    }),
    userId: z.number(),
    challengeId: z.number(),
  });
export const insertWeightRecordSchema = createInsertSchema(weightRecords)
  .extend({
    weight: z.string().min(1, "Weight is required"),
    imageUrl: z.string().url("Please enter a valid image URL").nullable(),
    verificationStatus: z.enum(["pending", "approved", "rejected"]).default("pending").optional(),
    recordedAt: z.coerce.date().optional(),
  });
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertFeedPostSchema = createInsertSchema(feedPosts)
  .extend({
    isScheduled: z.boolean().default(false),
    scheduledFor: z.string().optional()
      .refine(date => {
        if (!date) return true;
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime()) && dateObj > new Date();
      }, {
        message: "Scheduled date must be in the future"
      }),
    isPinned: z.boolean().default(false),
    imageUrl: z.string().optional(),
  });
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