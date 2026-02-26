import "dotenv/config";
import express from "express";
import { startPushScheduler } from "../pushScheduler";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import pg from "pg";

const { Pool } = pg;

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migrations] DATABASE_URL niet ingesteld — migraties overgeslagen");
    return;
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "routines" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "userId" varchar(255) NOT NULL UNIQUE,
        "sleepEnabled" boolean NOT NULL DEFAULT false,
        "bedtime" varchar(5) NOT NULL DEFAULT '22:00',
        "wakeTime" varchar(5) NOT NULL DEFAULT '07:00',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "pushSubscriptions" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "userId" varchar(255) NOT NULL UNIQUE,
        "subscription" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log("[Migrations] Tabellen routines en pushSubscriptions zijn aanwezig");
  } catch (err) {
    console.error("[Migrations] Fout bij uitvoeren migraties:", err);
  } finally {
    await pool.end();
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run migrations first
  await runMigrations();

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startPushScheduler();
  });
}

startServer().catch(console.error);
