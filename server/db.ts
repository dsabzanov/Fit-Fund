
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Create SQLite database file
const sqlite = new Database('sqlite.db');

// Create drizzle database instance
export const db = drizzle(sqlite, { schema });
