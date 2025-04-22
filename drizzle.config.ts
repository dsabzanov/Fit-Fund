
import { defineConfig } from "drizzle-kit";

const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - using default configuration");
    return "postgres://postgres:postgres@0.0.0.0:5432/postgres";
  }
  return process.env.DATABASE_URL;
};

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
