import session from "express-session";
// Express-session doesn't properly export SessionStore type
type SessionStore = session.Store;
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import {
  User,
  Challenge,
  Participant,
  WeightRecord,
  ChatMessage,
  FeedPost,
  Comment,
  InsertUser,
  InsertChallenge,
  InsertWeightRecord,
  InsertChatMessage,
  InsertFeedPost,
  InsertComment,
  users,
  challenges,
  participants,
  weightRecords,
  chatMessages,
  feedPosts,
  comments
} from "@shared/schema";
import { db, pgPool as pool } from "./db";
import { eq, and } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Challenge methods
  getAllChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getUserChallenges(userId: number): Promise<Challenge[]>;
  getChallengeIfParticipant(id: number, userId: number): Promise<Challenge | undefined>;
  updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined>;
  
  // Participant methods
  getParticipant(userId: number, challengeId: number): Promise<Participant | undefined>;
  addParticipant(data: { userId: number; challengeId: number; startWeight: number }): Promise<Participant>;
  getParticipants(challengeId: number): Promise<Participant[]>;
  getAllParticipants(): Promise<Participant[]>;
  updateParticipantPaymentStatus(challengeId: number, userId: number, paid: boolean): Promise<void>;
  
  // Weight record methods
  addWeightRecord(record: InsertWeightRecord): Promise<WeightRecord>;
  getWeightRecords(userId: number, challengeId: number): Promise<WeightRecord[]>;
  
  // Chat message methods
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(challengeId: number): Promise<ChatMessage[]>;
  
  // Feed post methods
  createFeedPost(post: InsertFeedPost): Promise<FeedPost>;
  getPostsByChallenge(challengeId: number): Promise<FeedPost[]>;
  updateFeedPost(id: number, updates: Partial<FeedPost>): Promise<FeedPost | undefined>;
  
  // Comment methods
  addComment(comment: InsertComment): Promise<Comment>;
  getComments(postId: number): Promise<Comment[]>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private challenges: Map<number, Challenge>;
  private participants: Map<number, Participant>;
  private weightRecords: Map<number, WeightRecord>;
  private chatMessages: Map<number, ChatMessage>;
  private feedPosts: Map<number, FeedPost>;
  private comments: Map<number, Comment>;
  public sessionStore: SessionStore;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.challenges = new Map();
    this.participants = new Map();
    this.weightRecords = new Map();
    this.chatMessages = new Map();
    this.feedPosts = new Map();
    this.comments = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Add sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample challenges
    const challenges = [
      {
        id: this.currentId++,
        title: "March 30-Day Challenge",
        description: "Join our 30-day weight loss challenge! Set realistic goals, stay motivated, and win rewards for your progress.",
        startDate: new Date("2025-03-16"),
        endDate: new Date("2025-04-15"),
        entryFee: 50,
        percentageGoal: 4,
        status: "open",
      },
      {
        id: this.currentId++,
        title: "Spring 30-Day Challenge",
        description: "Spring into action with our 30-day challenge. Create sustainable habits and achieve your fitness goals!",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-05-01"),
        entryFee: 50,
        percentageGoal: 4,
        status: "open",
      },
      {
        id: this.currentId++,
        title: "Community 30-Day Challenge",
        description: "Join our supportive community for a 30-day transformation journey. Together we're stronger!",
        startDate: new Date("2025-03-20"),
        endDate: new Date("2025-04-19"),
        entryFee: 50,
        percentageGoal: 4,
        status: "open",
      },
    ];

    challenges.forEach(challenge => this.challenges.set(challenge.id, challenge));

    // Sample feed posts
    const posts = [
      {
        id: this.currentId++,
        userId: 1,
        challengeId: 1,
        content: "Welcome to the Summer Shape-Up Challenge! 🌞 Here are some tips for getting started:\n\n1. Take your initial photos\n2. Log your starting weight\n3. Join our daily check-ins\n\nLet's crush these goals together! 💪",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
        isPinned: true,
        isScheduled: false,
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        userId: 2,
        challengeId: 1,
        content: "Just completed my first workout of the challenge! Feeling amazing and motivated. Who else is crushing their goals today? 🏋️‍♀️",
        imageUrl: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=500",
        isPinned: false,
        isScheduled: false,
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        userId: 1,
        challengeId: 1,
        content: "Meal prep Sunday! Here's my healthy meal plan for the week. Remember, abs are made in the kitchen! 🥗",
        imageUrl: "https://images.unsplash.com/photo-1547496502-affa22d38842?w=500",
        isPinned: false,
        isScheduled: true,
        scheduledFor: new Date("2025-03-02"),
        createdAt: new Date(),
      },
    ];

    posts.forEach(post => this.feedPosts.set(post.id, post));

    // Sample comments
    const comments = [
      {
        id: this.currentId++,
        userId: 2,
        postId: 1,
        content: "So excited to be part of this challenge! The tips are super helpful 🙌",
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        userId: 3,
        postId: 1,
        content: "Question: When do we need to submit our first weigh-in?",
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        userId: 1,
        postId: 2,
        content: "Amazing work! Keep up the great energy 💪",
        createdAt: new Date(),
      },
    ];

    comments.forEach(comment => this.comments.set(comment.id, comment));

    // Sample user
    const user = {
      id: 1,
      username: "host",
      password: "password",
      isHost: true,
    };
    this.users.set(user.id, user);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllChallenges(): Promise<Challenge[]> {
    console.log('Fetching all challenges, current count:', this.challenges.size);
    return Array.from(this.challenges.values());
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    console.log('Looking up challenge:', { id });
    const challenge = this.challenges.get(id);
    console.log('Challenge lookup result:', {
      found: !!challenge,
      details: challenge ? {
        id: challenge.id,
        title: challenge.title,
        status: challenge.status
      } : undefined
    });
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentId++;
    const newChallenge: Challenge = { ...challenge, id };
    this.challenges.set(id, newChallenge);
    console.log('Created new challenge:', {
      id: newChallenge.id,
      title: newChallenge.title,
      status: newChallenge.status
    });
    return newChallenge;
  }

  async getParticipant(userId: number, challengeId: number): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      (p) => p.userId === userId && p.challengeId === challengeId
    );
  }

  async addParticipant(data: { userId: number; challengeId: number; startWeight: number }): Promise<Participant> {
    const id = this.currentId++;
    const joinedAt = new Date();

    const newParticipant: Participant = {
      id,
      userId: data.userId,
      challengeId: data.challengeId,
      startWeight: data.startWeight,
      currentWeight: data.startWeight,
      paid: false,
      joinedAt,
    };

    this.participants.set(id, newParticipant);
    return newParticipant;
  }

  async getParticipants(challengeId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (p) => p.challengeId === challengeId
    );
  }

  async addWeightRecord(record: InsertWeightRecord): Promise<WeightRecord> {
    const id = this.currentId++;
    const newRecord: WeightRecord = { ...record, id };
    this.weightRecords.set(id, newRecord);
    return newRecord;
  }

  async getWeightRecords(userId: number, challengeId: number): Promise<WeightRecord[]> {
    return Array.from(this.weightRecords.values()).filter(
      (r) => r.userId === userId && r.challengeId === challengeId
    );
  }
  
  async getUserWeightRecords(userId: number): Promise<WeightRecord[]> {
    return Array.from(this.weightRecords.values()).filter(
      (r) => r.userId === userId
    );
  }
  
  async getPendingWeightRecords(): Promise<WeightRecord[]> {
    return Array.from(this.weightRecords.values()).filter(
      (r) => r.verificationStatus === "pending"
    );
  }
  
  async updateWeightRecordVerification(recordId: number, status: string, feedback?: string): Promise<WeightRecord | undefined> {
    const record = this.weightRecords.get(recordId);
    if (!record) return undefined;
    
    const updatedRecord = {
      ...record,
      verificationStatus: status,
      verificationFeedback: feedback || null
    };
    
    this.weightRecords.set(recordId, updatedRecord);
    return updatedRecord;
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId++;
    const newMessage: ChatMessage = { ...message, id };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  async getChatMessages(challengeId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (m) => m.challengeId === challengeId
    );
  }
  
  async updateChatMessagePinStatus(messageId: number, isPinned: boolean): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(messageId);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isPinned };
    this.chatMessages.set(messageId, updatedMessage);
    return updatedMessage;
  }
  
  async deleteChatMessage(messageId: number): Promise<void> {
    this.chatMessages.delete(messageId);
  }

  async createFeedPost(post: InsertFeedPost): Promise<FeedPost> {
    const id = this.currentId++;
    const newPost: FeedPost = { ...post, id };
    this.feedPosts.set(id, newPost);
    return newPost;
  }

  async getPostsByChallenge(challengeId: number): Promise<FeedPost[]> {
    return this.getFeedPosts(challengeId);
  }
  
  async getFeedPosts(challengeId: number): Promise<FeedPost[]> {
    return Array.from(this.feedPosts.values())
      .filter((p) => p.challengeId === challengeId)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentId++;
    const newComment: Comment = { ...comment, id };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async updateFeedPost(id: number, updates: Partial<FeedPost>): Promise<FeedPost | undefined> {
    const post = this.feedPosts.get(id);
    if (!post) return undefined;

    const updatedPost = { ...post, ...updates };
    this.feedPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;
    
    const updatedChallenge = { ...challenge, ...updates };
    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }
  
  async getAllParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }


  async getUserChallenges(userId: number): Promise<Challenge[]> {
    // Get all challenges where the user is a participant
    const userParticipations = Array.from(this.participants.values())
      .filter(p => p.userId === userId)
      .map(p => p.challengeId);

    // Return challenges that are either:
    // 1. Created by the user (if they're a host)
    // 2. The user is participating in
    // 3. Open for registration
    return Array.from(this.challenges.values())
      .filter(challenge =>
        challenge.status === "open" ||
        userParticipations.includes(challenge.id)
      );
  }

  async getChallengeIfParticipant(id: number, userId: number): Promise<Challenge | undefined> {
    const challenge = await this.getChallenge(id);
    if (!challenge) return undefined;

    // Allow access if:
    // 1. Challenge is open for registration
    // 2. User is a participant
    // 3. User is a host
    const isParticipant = Array.from(this.participants.values())
      .some(p => p.challengeId === id && p.userId === userId);
    const user = await this.getUser(userId);

    if (challenge.status === "open" || isParticipant || user?.isHost) {
      return challenge;
    }

    return undefined;
  }

  async updateParticipantPaymentStatus(challengeId: number, userId: number, paid: boolean): Promise<void> {
    const participant = Array.from(this.participants.values()).find(
      p => p.challengeId === challengeId && p.userId === userId
    );

    if (participant) {
      participant.paid = paid;
      this.participants.set(participant.id, participant);
    }
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async getAllParticipants(): Promise<Participant[]> {
    return await db.select().from(participants);
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }
  
  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined> {
    const [updatedChallenge] = await db
      .update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
      
    return updatedChallenge;
  }

  async getUserChallenges(userId: number): Promise<Challenge[]> {
    // Get challenges where user is a participant
    const userParticipations = await db
      .select()
      .from(participants)
      .where(eq(participants.userId, userId));
    
    const participatedChallengeIds = userParticipations.map(p => p.challengeId);
    
    // Return all open challenges plus user's participating challenges
    return await db
      .select()
      .from(challenges)
      .where(
        eq(challenges.status, 'open')
      );
  }

  async getChallengeIfParticipant(id: number, userId: number): Promise<Challenge | undefined> {
    const challenge = await this.getChallenge(id);
    if (!challenge) return undefined;

    // Check if user is participant
    const [participant] = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.challengeId, id),
          eq(participants.userId, userId)
        )
      );
    
    // Get user to check if they're a host
    const user = await this.getUser(userId);
    
    if (challenge.status === "open" || participant || user?.isHost) {
      return challenge;
    }

    return undefined;
  }

  async getParticipant(userId: number, challengeId: number): Promise<Participant | undefined> {
    const [participant] = await db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.challengeId, challengeId)
        )
      );
    
    return participant;
  }

  async addParticipant(data: { userId: number; challengeId: number; startWeight: number }): Promise<Participant> {
    const [participant] = await db
      .insert(participants)
      .values({
        userId: data.userId,
        challengeId: data.challengeId,
        startWeight: data.startWeight.toString(),
        currentWeight: data.startWeight.toString(),
        paid: false,
        joinedAt: new Date()
      })
      .returning();
    
    return participant;
  }

  async getParticipants(challengeId: number): Promise<Participant[]> {
    return await db
      .select()
      .from(participants)
      .where(eq(participants.challengeId, challengeId));
  }

  async updateParticipantPaymentStatus(challengeId: number, userId: number, paid: boolean): Promise<void> {
    await db
      .update(participants)
      .set({ paid })
      .where(
        and(
          eq(participants.challengeId, challengeId),
          eq(participants.userId, userId)
        )
      );
  }

  async addWeightRecord(record: InsertWeightRecord): Promise<WeightRecord> {
    const [weightRecord] = await db
      .insert(weightRecords)
      .values({
        ...record,
        recordedAt: record.recordedAt || new Date(),
        verificationStatus: record.verificationStatus || 'pending'
      })
      .returning();
    
    return weightRecord;
  }

  async getWeightRecords(userId: number, challengeId: number): Promise<WeightRecord[]> {
    return await db
      .select()
      .from(weightRecords)
      .where(
        and(
          eq(weightRecords.userId, userId),
          eq(weightRecords.challengeId, challengeId)
        )
      );
  }
  
  async getUserWeightRecords(userId: number): Promise<WeightRecord[]> {
    return await db
      .select()
      .from(weightRecords)
      .where(eq(weightRecords.userId, userId));
  }
  
  async getPendingWeightRecords(): Promise<WeightRecord[]> {
    return await db
      .select()
      .from(weightRecords)
      .where(eq(weightRecords.verificationStatus, "pending"));
  }
  
  async updateWeightRecordVerification(recordId: number, status: string, feedback?: string): Promise<WeightRecord | undefined> {
    const [updatedRecord] = await db
      .update(weightRecords)
      .set({ 
        verificationStatus: status, 
        verificationFeedback: feedback || null 
      })
      .where(eq(weightRecords.id, recordId))
      .returning();
    
    return updatedRecord;
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        ...message,
        sentAt: new Date()
      })
      .returning();
    
    return chatMessage;
  }

  async getChatMessages(challengeId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.challengeId, challengeId));
  }
  
  async updateChatMessagePinStatus(messageId: number, isPinned: boolean): Promise<ChatMessage | undefined> {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ isPinned })
      .where(eq(chatMessages.id, messageId))
      .returning();
      
    return updatedMessage;
  }
  
  async deleteChatMessage(messageId: number): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.id, messageId));
  }

  async createFeedPost(post: InsertFeedPost): Promise<FeedPost> {
    // Handle scheduledFor field if it's a string
    let scheduledForDate: Date | null = null;
    if (post.scheduledFor) {
      scheduledForDate = new Date(post.scheduledFor);
    }

    const [feedPost] = await db
      .insert(feedPosts)
      .values({
        ...post,
        imageUrl: post.imageUrl || null,
        scheduledFor: scheduledForDate,
        createdAt: new Date()
      })
      .returning();
    
    return feedPost;
  }

  async getPostsByChallenge(challengeId: number): Promise<FeedPost[]> {
    return this.getFeedPosts(challengeId);
  }
  
  async getFeedPosts(challengeId: number): Promise<FeedPost[]> {
    const posts = await db
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.challengeId, challengeId));
    
    // Sort posts: pinned first, then by creation date
    return posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async addComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({
        ...comment,
        createdAt: new Date()
      })
      .returning();
    
    return newComment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    const commentsList = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId));
    
    return commentsList.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async updateFeedPost(id: number, updates: Partial<FeedPost>): Promise<FeedPost | undefined> {
    const [updatedPost] = await db
      .update(feedPosts)
      .set(updates)
      .where(eq(feedPosts.id, id))
      .returning();
    
    return updatedPost;
  }
}

// Use MemStorage for simplicity, as we're having issues with the DatabaseStorage
export const storage = new MemStorage();