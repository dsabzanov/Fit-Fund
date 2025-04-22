
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import pg from 'pg';

// Create SQLite database file
const sqlite = new Database('sqlite.db');

// Create drizzle database instance
export const db = drizzle(sqlite, { schema });

// Create PostgreSQL pool for session storage
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
