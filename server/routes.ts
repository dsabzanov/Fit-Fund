import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertChallengeSchema,
  insertWeightRecordSchema,
  insertChatMessageSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === "chat") {
        // Broadcast chat message to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "chat",
              data: data.message
            }));
          }
        });
      }
    });
  });

  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    const challenges = await storage.getAllChallenges();
    res.json(challenges);
  });

  app.get("/api/challenges/:id", async (req, res) => {
    const challenge = await storage.getChallenge(parseInt(req.params.id));
    if (!challenge) return res.status(404).send("Challenge not found");
    res.json(challenge);
  });

  app.post("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const challenge = await storage.createChallenge(req.body);
    res.status(201).json(challenge);
  });

  // Participant routes
  app.post("/api/challenges/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const participant = await storage.addParticipant({
      userId: req.user!.id,
      challengeId: parseInt(req.params.id),
      startWeight: req.body.startWeight,
      currentWeight: req.body.startWeight,
      paid: false,
    });
    res.status(201).json(participant);
  });

  // Weight record routes
  app.post("/api/weight-records", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const weightRecord = await storage.addWeightRecord({
      ...req.body,
      userId: req.user!.id,
    });

    // Notify all clients about weight update
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "weight-update",
          data: weightRecord
        }));
      }
    });

    res.status(201).json(weightRecord);
  });

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const message = await storage.addChatMessage({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json(message);
  });

  return httpServer;
}
