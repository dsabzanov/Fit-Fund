import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
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
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Registration failed - username exists:', req.body.username);
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      console.log('User registered successfully:', user.id);
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      console.error('Registration error:', err);
      next(err);
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
          user = await storage.createUser({
            username: email,
            password: await hashPassword(uid + '_firebase_auth'), // Create a secure password
            isHost: false,
            currentWeight: null,
            targetWeight: null
          });
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