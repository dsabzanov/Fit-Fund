import { IStorage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import {
  User,
  Challenge,
  Participant,
  WeightRecord,
  ChatMessage,
  InsertUser,
  InsertChallenge,
  InsertParticipant,
  InsertWeightRecord,
  InsertChatMessage,
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private challenges: Map<number, Challenge>;
  private participants: Map<number, Participant>;
  private weightRecords: Map<number, WeightRecord>;
  private chatMessages: Map<number, ChatMessage>;
  public sessionStore: session.SessionStore;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.challenges = new Map();
    this.participants = new Map();
    this.weightRecords = new Map();
    this.chatMessages = new Map();
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
}

export const storage = new MemStorage();
