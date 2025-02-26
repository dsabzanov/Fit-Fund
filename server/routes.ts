import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { getAuth } from "firebase-admin/auth";
import {
  insertChallengeSchema,
  insertWeightRecordSchema,
  insertChatMessageSchema,
  insertFeedPostSchema,
  insertCommentSchema,
  insertParticipantSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws-chat" });

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received message:", data);

        if (data.type === "chat") {
          // Broadcast chat message to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "chat",
                challengeId: data.challengeId,
                message: data.message
              }));
            }
          });
        }
      } catch (error) {
        console.error("Error processing message:", error);
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
  app.post("/api/challenges/:challengeId/join", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const challengeId = parseInt(req.params.challengeId);
      const startWeight = req.body.startWeight;
      const userId = req.user!.id;

      console.log('Join request:', { 
        challengeId, 
        startWeight, 
        userId,
        body: req.body 
      });

      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Check if user is already participating
      const existingParticipant = await storage.getParticipant(
        userId,
        challengeId
      );

      if (existingParticipant) {
        return res.status(400).json({ error: "Already joined this challenge" });
      }

      // Create new participant using the schema validation
      try {
        const validatedData = insertParticipantSchema.parse({
          startWeight,
          challengeId,
          userId,
        });

        const participant = await storage.addParticipant(validatedData);
        console.log('Participant created:', participant);
        res.status(201).json(participant);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ error: "Invalid participant data" });
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ error: "Failed to join challenge" });
    }
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

  app.get("/api/challenges/:id/users/:userId/weight-records", async (req, res) => {
    const records = await storage.getWeightRecords(
      parseInt(req.params.id),
      parseInt(req.params.userId)
    );
    res.json(records);
  });

  // Feed post routes
  app.post("/api/challenges/:id/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const post = await storage.createFeedPost({
      ...req.body,
      userId: req.user!.id,
      challengeId: parseInt(req.params.id),
    });
    res.status(201).json(post);
  });

  app.get("/api/challenges/:id/posts", async (req, res) => {
    const posts = await storage.getFeedPosts(parseInt(req.params.id));
    res.json(posts);
  });

  app.patch("/api/posts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const post = await storage.updateFeedPost(parseInt(req.params.id), req.body);
    if (!post) return res.status(404).send("Post not found");
    res.json(post);
  });

  // Comment routes
  app.post("/api/posts/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const comment = await storage.addComment({
      ...req.body,
      userId: req.user!.id,
      postId: parseInt(req.params.id),
    });
    res.status(201).json(comment);
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    const comments = await storage.getComments(parseInt(req.params.id));
    res.json(comments);
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

  // Google Auth endpoint
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken } = req.body;
      const decodedToken = await getAuth().verifyIdToken(idToken);

      // Check if user exists
      let user = await storage.getUserByUsername(decodedToken.email!);

      if (!user) {
        // Create new user if they don't exist
        user = await storage.createUser({
          username: decodedToken.email!,
          password: "", // Google users don't need a password
        });
      }

      // Log them in
      req.login(user, (err) => {
        if (err) throw err;
        res.json(user);
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  return httpServer;
}