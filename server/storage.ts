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
  InsertParticipant,
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
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
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

  async addParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.currentId++;
    const newParticipant: Participant = { ...participant, id };
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
}

export const storage = new MemStorage();