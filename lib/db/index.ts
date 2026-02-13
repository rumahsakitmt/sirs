import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Configure postgres client with SSL for Supabase
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10, // connection pool size
});

export const db = drizzle(client, { schema });
