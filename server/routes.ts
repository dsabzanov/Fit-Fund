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

// Initialize Stripe with error handling
let stripe: Stripe | null = null;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  stripe = null;
}

// Payment session validation schema
const createPaymentSessionSchema = z.object({
  challengeId: z.number(),
  amount: z.number().min(0)
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws-chat" });

  // Serve uploaded files statically
  app.use('/uploads', express.static('public/uploads'));

  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    const challenges = await storage.getAllChallenges();
    res.json(challenges);
  });

  app.get("/api/challenges/open", async (req, res) => {
    const challenges = await storage.getAllChallenges();
    const openChallenges = challenges.filter(c => c.status === "open");
    res.json(openChallenges);
  });

  app.get("/api/challenges/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const challenges = await storage.getUserChallenges(userId);
    res.json(challenges);
  });

  app.get("/api/challenges/:id", async (req, res) => {
    const challengeId = parseInt(req.params.id);
    console.log('Fetching challenge:', challengeId);

    const challenge = await storage.getChallenge(challengeId);
    console.log('Retrieved challenge:', challenge);

    if (!challenge) {
      console.log('Challenge not found:', challengeId);
      return res.status(404).json({ error: "Challenge not found" });
    }

    // If user is authenticated, attach additional user-specific data
    if (req.isAuthenticated()) {
      console.log('User is authenticated:', req.user?.id);
    }

    res.json(challenge);
  });

  app.post("/api/challenges", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log('Creating challenge with data:', req.body);

      // Validate the challenge data
      const validatedData = insertChallengeSchema.parse(req.body);
      console.log('Validated challenge data:', validatedData);

      // Create the challenge
      const challenge = await storage.createChallenge({
        ...validatedData,
        userId: req.user!.id, // Add the user ID who created the challenge
      });

      console.log('Created new challenge:', challenge);

      // Return the full challenge object
      res.status(201).json(challenge);
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid challenge data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create challenge' });
    }
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

      res.json(participant);
    } catch (error: any) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ error: "Failed to join challenge" });
    }
  });

  // Payment routes with improved error handling
  app.post("/api/create-payment-session", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if Stripe is initialized
      if (!stripe) {
        console.error('Stripe not initialized');
        return res.status(500).json({ error: "Payment service unavailable" });
      }

      // Validate request data
      const { challengeId, amount } = createPaymentSessionSchema.parse(req.body);

      console.log('Creating payment session:', {
        userId: req.user?.id,
        challengeId,
        amount
      });

      // Create Stripe checkout session
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
              unit_amount: Math.round(amount * 100), // Convert to cents
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

      console.log('Payment session created successfully:', {
        sessionId: session.id,
        userId: req.user?.id,
        challengeId
      });

      res.json({ sessionId: session.id });
    } catch (error: any) {
      console.error('Error creating payment session:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payment data provided' });
      }

      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to create payment session' });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
    if (!stripe) {
      console.error('Stripe not initialized in webhook handler');
      return res.status(500).json({ error: "Payment service unavailable" });
    }

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

        const challengeId = parseInt(session.metadata!.challengeId);
        const userId = parseInt(session.metadata!.userId);

        console.log('Updating payment status for:', { challengeId, userId });
        await storage.updateParticipantPaymentStatus(challengeId, userId, true);
        console.log('Payment status updated successfully');
      }

      res.json({received: true});
    } catch (err: any) {
      console.error('Webhook Error:', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  return httpServer;
}