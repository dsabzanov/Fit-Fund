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
import Stripe from "stripe";

// Initialize Stripe with error handling
let stripe: Stripe | null = null;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
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
  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    const userId = parseInt(req.params.id);
    
    try {
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  app.get("/api/admin/challenges", async (req, res) => {
    if (!req.isAuthenticated() || !req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });
  
  app.patch("/api/admin/challenges/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    const challengeId = parseInt(req.params.id);
    
    try {
      const updatedChallenge = await storage.updateChallenge(challengeId, req.body);
      res.json(updatedChallenge);
    } catch (error) {
      console.error("Error updating challenge:", error);
      res.status(500).json({ error: "Failed to update challenge" });
    }
  });
  
  app.get("/api/admin/participants", async (req, res) => {
    if (!req.isAuthenticated() || !req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    try {
      const participants = await storage.getAllParticipants();
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });
  
  app.patch("/api/admin/participants/:challengeId/:userId/payment", async (req, res) => {
    if (!req.isAuthenticated() || !req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    try {
      const challengeId = parseInt(req.params.challengeId);
      const userId = parseInt(req.params.userId);
      const paid = req.body.paid === true;
      
      console.log(`Admin updating payment status: Challenge ${challengeId}, User ${userId}, Paid: ${paid}`);
      
      await storage.updateParticipantPaymentStatus(challengeId, userId, paid);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });
  
  setupAuth(app);
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws-chat" });

  // Create the uploads directory at server startup
  const uploadDir = 'public/uploads';
  try {
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creating upload directory: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    } else {
      console.log(`Upload directory already exists: ${uploadDir}`);
    }
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
  
  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Double-check that uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        console.log(`Creating upload directory on-demand: ${uploadDir}`);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      console.log(`Storing file in: ${uploadDir}`);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create unique filename with timestamp and original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const filename = file.fieldname + '-' + uniqueSuffix + extension;
      console.log(`Generated filename: ${filename}`);
      cb(null, filename);
    }
  });
  
  const upload = multer({ 
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB file size limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });
  
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
  
  // Add missing endpoint for participants
  app.get("/api/challenges/:id/participants", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ error: "Invalid challenge ID" });
      }
      
      const participants = await storage.getParticipants(challengeId);
      console.log(`Fetched ${participants.length} participants for challenge ${challengeId}`);
      
      res.json(participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });
  
  // Add endpoint for getting a single participant
  app.get("/api/challenges/:id/participants/:userId", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(challengeId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid challenge ID or user ID" });
      }
      
      const participant = await storage.getParticipant(userId, challengeId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      res.json(participant);
    } catch (error) {
      console.error('Error fetching participant:', error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });
  
  // Add missing endpoint for weight records
  app.get("/api/challenges/:id/weight-records", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ error: "Invalid challenge ID" });
      }
      
      // Get all participants for this challenge
      const participants = await storage.getParticipants(challengeId);
      
      // Get all weight records for all participants
      const weightRecords = [];
      for (const participant of participants) {
        const records = await storage.getWeightRecords(participant.userId, challengeId);
        weightRecords.push(...records);
      }
      
      console.log(`Fetched ${weightRecords.length} weight records for challenge ${challengeId}`);
      
      res.json(weightRecords);
    } catch (error) {
      console.error('Error fetching weight records:', error);
      res.status(500).json({ error: "Failed to fetch weight records" });
    }
  });
  
  // Add missing endpoint for chat messages
  app.get("/api/challenges/:id/chat", async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ error: "Invalid challenge ID" });
      }
      
      const chatMessages = await storage.getChatMessages(challengeId);
      console.log(`Fetched ${chatMessages.length} chat messages for challenge ${challengeId}`);
      
      res.json(chatMessages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log('Creating challenge with data:', req.body);

      try {
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
      } catch (validationError: any) {
        console.error('Validation error creating challenge:', validationError);
        
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            error: 'Invalid challenge data', 
            details: validationError.errors.map(err => ({
              path: err.path,
              message: err.message
            }))
          });
        }
        
        // Other validation errors
        return res.status(400).json({ 
          error: validationError.message || 'Invalid challenge data'
        });
      }
    } catch (error: any) {
      console.error('Server error creating challenge:', error);
      res.status(500).json({ error: 'Failed to create challenge: ' + (error.message || 'Unknown error') });
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

  // Weight record route with file upload
  app.post('/api/weight-records', upload.single('image'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { weight, challengeId } = req.body;
      
      if (!weight || !challengeId) {
        return res.status(400).json({ error: "Weight and challengeId are required" });
      }

      // Process the uploaded file if present
      let imageUrl = '';
      if (req.file) {
        // Create a relative URL for the uploaded file
        imageUrl = `/uploads/${req.file.filename}`;
      }

      // Create weight record
      const weightRecord = await storage.addWeightRecord({
        userId: req.user!.id,
        challengeId: parseInt(challengeId),
        weight: parseFloat(weight) as any, // Cast to avoid type error
        imageUrl,
        verificationStatus: 'pending' as any, // Type cast to avoid error
        recordedAt: new Date(), // Changed from createdAt to match schema
      });

      return res.status(201).json(weightRecord);
    } catch (error: any) {
      console.error('Error adding weight record:', error);
      return res.status(500).json({ error: 'Failed to add weight record' });
    }
  });

  // Post routes with file upload support
  app.post('/api/challenges/:challengeId/posts', upload.single('image'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user!.id;
      
      console.log('Creating post for challenge:', { challengeId, userId });
      console.log('Request body:', req.body);
      
      // Basic validation
      if (!req.body.content) {
        return res.status(400).json({ error: "Post content is required" });
      }
      
      // Process uploaded file if present
      let imageUrl = '';
      if (req.file) {
        // Create a relative URL for the uploaded file
        imageUrl = `/uploads/${req.file.filename}`;
        console.log('Image URL created:', imageUrl);
      }
      
      // Handle scheduled posts
      const isScheduled = req.body.isScheduled === 'true';
      let scheduledFor = null;
      
      if (isScheduled && req.body.scheduledFor) {
        scheduledFor = new Date(req.body.scheduledFor);
        console.log('Post scheduled for:', scheduledFor);
      }
      
      // Create post
      const post = await storage.createFeedPost({
        userId,
        challengeId,
        content: req.body.content,
        imageUrl,
        isPinned: req.body.isPinned === 'true',
        isScheduled,
        scheduledFor: scheduledFor as any, // Cast to avoid type error
        createdAt: new Date(),
      });
      
      console.log('Created new post:', post);
      
      // Get all posts to verify storage
      const allPosts = await storage.getFeedPosts(challengeId);
      console.log(`After creation: ${allPosts.length} posts for challenge ${challengeId}`);
      
      return res.status(201).json(post);
    } catch (error: any) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  });
  
  // Simple post endpoint (without file upload) for more reliable posts
  app.post('/api/challenges/:challengeId/posts/simple', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const challengeId = parseInt(req.params.challengeId);
      const userId = req.user!.id;
      
      console.log('Creating simple post for challenge:', { challengeId, userId });
      console.log('Request body:', req.body);
      
      // Basic validation
      if (!req.body.content) {
        return res.status(400).json({ error: "Post content is required" });
      }
      
      // Handle scheduled posts
      const isScheduled = Boolean(req.body.isScheduled);
      let scheduledFor = null;
      
      if (isScheduled && req.body.scheduledFor) {
        scheduledFor = new Date(req.body.scheduledFor);
        console.log('Post scheduled for:', scheduledFor);
      }
      
      // Create post (without image)
      const post = await storage.createFeedPost({
        userId,
        challengeId,
        content: req.body.content,
        imageUrl: '', // No image for simple posts
        isPinned: Boolean(req.body.isPinned),
        isScheduled,
        scheduledFor: scheduledFor as any, // Cast to avoid type error
        createdAt: new Date(),
      });
      
      console.log('Created new simple post:', post);
      
      // Log the post we just created
      console.log('New post details:', {
        id: post.id,
        content: post.content,
        userId: post.userId,
        challengeId: post.challengeId,
        isPinned: post.isPinned,
        isScheduled: post.isScheduled
      });
      
      // Get all posts to verify storage and log each one for debugging
      const allPosts = await storage.getPostsByChallenge(challengeId);
      console.log(`After creation: ${allPosts.length} posts for challenge ${challengeId}`);
      allPosts.forEach((p, i) => {
        console.log(`Post ${i+1}:`, { 
          id: p.id, 
          content: p.content.substring(0, 20) + (p.content.length > 20 ? '...' : ''),
          userId: p.userId 
        });
      });
      
      return res.status(201).json(post);
    } catch (error: any) {
      console.error('Error creating simple post:', error);
      return res.status(500).json({ error: 'Failed to create post: ' + (error.message || 'Unknown error') });
    }
  });

  // Get posts for a challenge
  app.get('/api/challenges/:challengeId/posts', async (req, res) => {
    try {
      const challengeId = parseInt(req.params.challengeId);
      
      // Basic validation
      if (isNaN(challengeId)) {
        return res.status(400).json({ error: "Invalid challenge ID" });
      }
      
      // Changed to use getPostsByChallenge to match what we're using for creating posts
      const posts = await storage.getPostsByChallenge(challengeId);
      console.log(`GET posts for challenge ${challengeId}:`, posts.length);
      
      // Log the posts for debugging
      if (posts.length > 0) {
        posts.forEach((p, i) => {
          console.log(`Post ${i+1}:`, { 
            id: p.id, 
            content: p.content.substring(0, 20) + (p.content.length > 20 ? '...' : ''),
            userId: p.userId 
          });
        });
      }
      
      return res.json(posts);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Comments routes
  app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      // Basic validation
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      const comments = await storage.getComments(postId);
      return res.json(comments);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });
  
  app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      
      // Basic validation
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }
      
      if (!req.body.content) {
        return res.status(400).json({ error: "Comment content is required" });
      }
      
      // Create comment
      const comment = await storage.addComment({
        userId,
        postId,
        content: req.body.content,
        createdAt: new Date(),
      });
      
      console.log('Created new comment:', comment);
      
      return res.status(201).json(comment);
    } catch (error: any) {
      console.error('Error creating comment:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
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
  
  // Toggle pin status of a feed post (host only)
  app.put("/api/challenges/:challengeId/posts/:postId/pin", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const challengeId = parseInt(req.params.challengeId);
      const postId = parseInt(req.params.postId);
      
      if (isNaN(challengeId) || isNaN(postId)) {
        return res.status(400).json({ error: "Invalid IDs" });
      }

      // Verify if the user is the host of the challenge
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.userId !== req.user!.id) {
        return res.status(403).json({ error: "Only the host can pin posts" });
      }
      
      // Get the post to toggle its pin status
      const posts = await storage.getPostsByChallenge(challengeId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Update the post with toggled pin status
      const updatedPost = await storage.updateFeedPost(postId, {
        isPinned: !post.isPinned
      });
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error toggling post pin status:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  return httpServer;
}