import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : undefined);

  if (existing.length > 0) {
    await db.update(users).set({
      ...user,
      role,
      lastSignedIn: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.openId, user.openId));
    return;
  }

  await db.insert(users).values({
    ...user,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
