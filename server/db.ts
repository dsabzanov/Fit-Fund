
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL and provide fallback configuration
const getDatabaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - using fallback configuration");
    return {
      host: '0.0.0.0',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres'
    };
  }
  return { connectionString: process.env.DATABASE_URL };
};

export const pool = new Pool(getDatabaseConfig());
export const db = drizzle({ client: pool, schema });
