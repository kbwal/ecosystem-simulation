import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

let _db: NeonHttpDatabase | null = null;

export function getDb(): NeonHttpDatabase {
    if (!_db) {
        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error("DATABASE_URL environment variable is not set");
        }
        _db = drizzle(neon(url));
    }
    return _db;
}

export const db = new Proxy({} as NeonHttpDatabase, {
    get(_target, prop) {
        const instance = getDb();
        const value = (instance as any)[prop];
        return typeof value === "function" ? value.bind(instance) : value;
    },
});

