
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import pg from 'pg';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL pool for all database operations
export const pgPool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Create drizzle database instance with PostgreSQL
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// Export pgPool as pool for compatibility with existing imports
export { pgPool as pool };
