import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL and provide fallback configuration
const getDatabaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - using fallback SQLite configuration");
    return { connectionString: 'sqlite://database.db' };
  }
  return { connectionString: process.env.DATABASE_URL };
};

export const pool = new Pool(getDatabaseConfig());
export const db = drizzle({ client: pool, schema });