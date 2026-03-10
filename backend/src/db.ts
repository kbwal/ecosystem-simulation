import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });

export const db = drizzle(pool);
