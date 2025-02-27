import { IStorage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
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
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private challenges: Map<number, Challenge>;
  private participants: Map<number, Participant>;
  private weightRecords: Map<number, WeightRecord>;
  private chatMessages: Map<number, ChatMessage>;
  private feedPosts: Map<number, FeedPost>;
  private comments: Map<number, Comment>;
  private fitbitTokens: Map<number, { access_token: string; refresh_token: string; user_id: string; username?: string }>;
  public sessionStore: session.SessionStore;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.challenges = new Map();
    this.participants = new Map();
    this.weightRecords = new Map();
    this.chatMessages = new Map();
    this.feedPosts = new Map();
    this.comments = new Map();
    this.fitbitTokens = new Map();
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
        title: "Summer Shape-Up Challenge",
        description: "Get ready for summer with this 30-day weight loss challenge! Join now to transform your body and win big.",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        entryFee: 50,
        percentageGoal: 10,
        status: "open",
      },
      {
        id: this.currentId++,
        title: "Spring Into Fitness",
        description: "Spring is the perfect time for a fresh start. Join our 6-week challenge and achieve your fitness goals!",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-05-15"),
        entryFee: 75,
        percentageGoal: 8,
        status: "open",
      },
      {
        id: this.currentId++,
        title: "90-Day Transformation",
        description: "The ultimate transformation challenge. Change your life in 90 days with daily support and motivation.",
        startDate: new Date("2025-03-15"),
        endDate: new Date("2025-06-15"),
        entryFee: 100,
        percentageGoal: 15,
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
    return Array.from(this.challenges.values());
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentId++;
    const newChallenge: Challenge = { ...challenge, id };
    this.challenges.set(id, newChallenge);
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

  async createFeedPost(post: InsertFeedPost): Promise<FeedPost> {
    const id = this.currentId++;
    const newPost: FeedPost = { ...post, id };
    this.feedPosts.set(id, newPost);
    return newPost;
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

  // Add new Fitbit token methods
  async storeFitbitTokens(userId: number, tokens: { access_token: string; refresh_token: string; user_id: string }): Promise<void> {
    this.fitbitTokens.set(userId, { ...tokens, username: undefined });
  }

  async getFitbitTokens(userId: number): Promise<{ access_token: string; refresh_token: string; user_id: string; username?: string } | undefined> {
    return this.fitbitTokens.get(userId);
  }

  async removeFitbitTokens(userId: number): Promise<void> {
    this.fitbitTokens.delete(userId);
  }
}

export const storage = new MemStorage();