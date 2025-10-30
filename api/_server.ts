import express from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";
import { runMigrations, verifyDatabaseConnection } from "../server/migrations";

let app: ReturnType<typeof express> | null = null;
let initPromise: Promise<void> | null = null;

async function init() {
  if (app) return;
  const instance = express();
  instance.use(express.json({ limit: "10mb" }));
  instance.use(express.urlencoded({ extended: false, limit: "10mb" }));
  instance.use(cookieParser());

  await registerRoutes(instance);

  try {
    if (process.env.SKIP_DB_MIGRATIONS !== "true") {
      await runMigrations();
    }
    await verifyDatabaseConnection();
  } catch (err) {
    console.warn("Serverless DB init warning:", (err as Error)?.message);
  }

  app = instance;
}

export async function getServerApp() {
  if (!initPromise) {
    initPromise = init().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  await initPromise;
  if (!app) throw new Error("API not initialized");
  return app;
}

