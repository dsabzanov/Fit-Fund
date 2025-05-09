import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { createOrUpdateContact } from "./services/go-high-level";
import { getAuth } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    proxy: true,
    cookie: {
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Attempting authentication for user:', username);
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          console.log('Authentication failed for user:', username);
          return done(null, false);
        }
        console.log('Authentication successful for user:', username);
        return done(null, user);
      } catch (err) {
        console.error('Authentication error:', err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Registration attempt for username:', req.body.username);
      
      if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Registration failed - username exists:', req.body.username);
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      // Default user fields
      const userFields = {
        ...req.body,
        password: hashedPassword,
        isAdmin: !!req.body.isAdmin,
        isHost: !!req.body.isHost,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        email: req.body.email || null,
        currentWeight: req.body.currentWeight || null,
        targetWeight: req.body.targetWeight || null,
        onboardingComplete: false,
      };

      const user = await storage.createUser(userFields);

      console.log('User registered successfully:', user.id);
      
      // Add user to Go High Level with Fitfund_Customer tag
      const GHL_API_KEY = process.env.GO_HIGH_LEVEL_API_KEY;
      const GHL_LOCATION_ID = process.env.GO_HIGH_LEVEL_LOCATION_ID;
      
      if (GHL_API_KEY && GHL_LOCATION_ID && user.email) {
        try {
          console.log('Adding new user to Go High Level with Fitfund_Customer tag:', user.email);
          await createOrUpdateContact(user, ['Fitfund_Customer']);
          console.log('Successfully added user to Go High Level');
        } catch (ghlError) {
          console.error('Error adding user to Go High Level:', ghlError);
          // Continue with login even if GHL integration fails
        }
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Login after registration failed:', err);
          return res.status(500).json({ error: "Registration successful but login failed" });
        }
        res.status(201).json(user);
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: "Registration failed - internal server error" });
    }
  });
  
  // Special admin creation endpoint - DEVELOPMENT USE ONLY
  app.post("/api/register-admin", async (req, res, next) => {
    try {
      console.log('Admin registration attempt for username:', req.body.username);
      
      if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Check for dev code to prevent unauthorized admin creation
      if (req.body.devCode !== "fitfund-admin-2024") {
        return res.status(403).json({ error: "Unauthorized admin creation attempt" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Admin registration failed - username exists:', req.body.username);
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
        isAdmin: true,
        isHost: true,
        email: req.body.email || null,
        currentWeight: req.body.currentWeight || null,
        targetWeight: req.body.targetWeight || null,
      });

      console.log('Admin user registered successfully:', user.id);
      req.login(user, (err) => {
        if (err) {
          console.error('Login after admin registration failed:', err);
          return res.status(500).json({ error: "Admin registration successful but login failed" });
        }
        res.status(201).json(user);
      });
    } catch (err) {
      console.error('Admin registration error:', err);
      res.status(500).json({ error: "Admin registration failed - internal server error" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log('Login successful for user:', req.user?.id);
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log('Logout attempt for user:', req.user?.id);
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('Logout successful');
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('User session check:', {
      isAuthenticated: req.isAuthenticated(),
      userId: req.user?.id
    });
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Google authentication callback endpoint
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      console.log('Google authentication attempt');
      const { idToken } = req.body;
      if (!idToken) {
        console.log('Google auth failed: No ID token provided');
        return res.status(400).json({ error: "ID token is required" });
      }
      
      // Verify the Firebase token
      try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const { email, uid } = decodedToken;
        
        if (!email) {
          console.log('Google auth failed: No email in token');
          return res.status(400).json({ error: "Email not provided in token" });
        }
        
        console.log('Google auth token verified for email:', email);
        
        // Check if user exists
        let user = await storage.getUserByUsername(email);
        
        // If user doesn't exist, create a new account
        if (!user) {
          console.log('Creating new user from Google auth:', email);
          // Try to extract first/last name from email (simple approach)
          const emailParts = email.split('@')[0].split('.');
          const possibleFirstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : undefined;
          const possibleLastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : undefined;
          
          user = await storage.createUser({
            username: email,
            password: await hashPassword(uid + '_firebase_auth'), // Create a secure password
            isHost: false,
            isAdmin: false,
            firstName: possibleFirstName || undefined,
            lastName: possibleLastName || undefined,
            email: email,
            currentWeight: null,
            targetWeight: null,
            onboardingComplete: false,
            createdAt: new Date()
          });
          
          // Add Google-login user to Go High Level with Fitfund_Customer tag
          const GHL_API_KEY = process.env.GO_HIGH_LEVEL_API_KEY;
          const GHL_LOCATION_ID = process.env.GO_HIGH_LEVEL_LOCATION_ID;
          
          if (GHL_API_KEY && GHL_LOCATION_ID) {
            try {
              console.log('Adding new Google user to Go High Level with Fitfund_Customer tag:', email);
              await createOrUpdateContact(user, ['Fitfund_Customer']);
              console.log('Successfully added Google user to Go High Level');
            } catch (ghlError) {
              console.error('Error adding Google user to Go High Level:', ghlError);
              // Continue with login even if GHL integration fails
            }
          }
        } else {
          console.log('Existing user found for Google auth:', email);
        }
        
        // Log user in
        req.login(user, (err) => {
          if (err) {
            console.error('Google auth login error:', err);
            return next(err);
          }
          console.log('Google auth successful for user:', user.id);
          res.json(user);
        });
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return res.status(401).json({ error: "Invalid ID token" });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      next(error);
    }
  });
}