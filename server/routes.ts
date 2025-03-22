import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { getAuth } from "firebase-admin/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from 'express';
import {
  insertChallengeSchema,
  insertWeightRecordSchema,
  insertChatMessageSchema,
  insertFeedPostSchema,
  insertCommentSchema,
  insertParticipantSchema,
} from "@shared/schema";
import { fitbitService } from "./services/fitbit";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws-chat" });

  // Serve uploaded files statically
  app.use('/uploads', express.static('public/uploads'));

  // Fitbit routes
  app.post("/api/fitbit/connect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const authUrl = fitbitService.getAuthorizationUrl(req.user!.id);
    res.json({ authUrl });
  });

  app.get("/api/fitbit/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).send("Missing authorization code");
      }

      const tokens = await fitbitService.handleCallback(code);

      // Store tokens in database
      await storage.storeFitbitTokens(parseInt(req.query.state as string), tokens);

      res.redirect("/profile"); // Redirect to profile page after successful connection
    } catch (error) {
      console.error("Fitbit callback error:", error);
      res.status(500).send("Failed to connect Fitbit account");
    }
  });

  app.get("/api/fitbit/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const tokens = await storage.getFitbitTokens(req.user!.id);
    res.json({
      connected: !!tokens,
      username: tokens?.username
    });
  });

  app.post("/api/fitbit/disconnect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await storage.removeFitbitTokens(req.user!.id);
    res.sendStatus(200);
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

  // Add new route for open challenges
  app.get("/api/challenges/open", async (req, res) => {
    const challenges = await storage.getAllChallenges();
    // Only return challenges that are open for registration
    const openChallenges = challenges.filter(c => c.status === "open");
    res.json(openChallenges);
  });

  // Add route for user-specific challenges
  app.get("/api/challenges/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const challenges = await storage.getUserChallenges(userId);
    res.json(challenges);
  });


  // Participant routes
  app.post("/api/challenges/:challengeId/join", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user!.id;
      const startWeight = Number(req.body.startWeight);

      // Basic validation
      if (isNaN(challengeId)) {
        return res.status(400).json({ error: "Invalid challenge ID" });
      }

      if (isNaN(startWeight) || startWeight <= 0) {
        return res.status(400).json({ error: "Invalid weight value" });
      }

      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        console.log('Challenge not found:', { challengeId });
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Check if already participating
      const existingParticipant = await storage.getParticipant(userId, challengeId);
      if (existingParticipant) {
        console.log('User already participating:', { userId, challengeId });
        return res.status(400).json({ error: "Already joined this challenge" });
      }

      // Create participant
      const participant = await storage.addParticipant({
        userId,
        challengeId,
        startWeight,
      });

      console.log('New participant added:', {
        participantId: participant.id,
        userId,
        challengeId,
        startWeight
      });

      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ error: "Failed to join challenge" });
    }
  });

  // Add new route to get participant information
  app.get("/api/challenges/:challengeId/participants/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const challengeId = parseInt(req.params.challengeId);
      const userId = parseInt(req.params.userId);

      console.log('Fetching participant:', { challengeId, userId });

      const participant = await storage.getParticipant(userId, challengeId);

      if (!participant) {
        console.log('No participant found for:', { challengeId, userId });
        return res.status(404).json({ error: "Participant not found" });
      }

      console.log('Found participant:', { 
        id: participant.id, 
        paid: participant.paid,
        startWeight: participant.startWeight 
      });

      res.json(participant);
    } catch (error) {
      console.error("Error fetching participant:", error);
      res.status(500).json({ error: "Failed to fetch participant information" });
    }
  });

  // Weight record routes with file upload
  app.post("/api/weight-records", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const weightRecord = await storage.addWeightRecord({
        ...req.body,
        userId: req.user!.id,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
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
    } catch (error) {
      console.error("Error adding weight record:", error);
      res.status(500).json({ error: "Failed to add weight record" });
    }
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

  // Add new routes for user data
  app.get("/api/users/:userId/weight-records", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const records = await storage.getWeightRecords(
      parseInt(req.params.userId),
      undefined // Don't filter by challenge ID when getting all records
    );
    res.json(records);
  });

  app.get("/api/users/:userId/participations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const participations = await storage.getParticipants(
      parseInt(req.params.userId)
    );
    res.json(participations);
  });

  // Payment routes
  app.post("/api/create-payment-session", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { challengeId, amount } = req.body;

      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Challenge Entry Fee',
                description: 'Entry fee for FitFund weight loss challenge',
              },
              unit_amount: amount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/challenge/${challengeId}?payment=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/challenge/${challengeId}?payment=cancelled`,
        metadata: {
          challengeId: challengeId.toString(),
          userId: req.user!.id.toString()
        }
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating payment session:', error);
      res.status(500).json({ error: 'Failed to create payment session' });
    }
  });

  // Add logging in webhook handler
  app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log('Received Stripe webhook event:', event.type);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Payment successful, metadata:', session.metadata);

        // Update challenge participation status after successful payment
        const challengeId = parseInt(session.metadata!.challengeId);
        const userId = parseInt(session.metadata!.userId);

        console.log('Updating payment status for:', { challengeId, userId });
        await storage.updateParticipantPaymentStatus(challengeId, userId, true);
        console.log('Payment status updated successfully');
      }

      res.json({received: true});
    } catch (err) {
      console.error('Webhook Error:', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  return httpServer;
}