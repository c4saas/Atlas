import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";
import { runMigrations, verifyDatabaseConnection } from "../server/migrations";
import { ensureActiveReleaseHasTemplates } from "../server/release-init";

// Build a single Express app instance for this serverless function runtime.
// Vercel invokes this handler per request; the app is initialized once per lambda
// instance (cold start) and reused across invocations.

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// Health endpoint compatible with existing code
let isReady = false;
let initError: Error | null = null;
app.get("/health", (_req: Request, res: Response) => {
  if (initError) {
    return res.status(503).json({ status: "error", message: initError.message });
  }
  if (isReady) {
    return res.status(200).json({ status: "ok" });
  }
  return res.status(200).json({ status: "initializing" });
});

// Simple API request logger (mirrors server/index.ts behavior for /api requests)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const ts = new Date().toISOString();
      // eslint-disable-next-line no-console
      console.log(`${ts} [express] ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// One-time async initialization
let initPromise: Promise<void> | null = null;
async function initOnce() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Register all routes and auth on the shared app instance
      await registerRoutes(app);

      // Error handler matching server/index.ts
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err?.status || err?.statusCode || 500;
        const message = err?.message || "Internal Server Error";
        res.status(status).json({ message, detail: err instanceof Error ? err.message : undefined });
        if (status >= 500) {
          // eslint-disable-next-line no-console
          console.error("Unhandled error:", err);
        }
      });

      // Run DB migrations and any other background init tasks
      await runMigrations();
      await verifyDatabaseConnection();
      await ensureActiveReleaseHasTemplates();
      isReady = true;
    } catch (err) {
      initError = err as Error;
      // eslint-disable-next-line no-console
      console.error("API init failed:", initError);
      // Do not rethrow to allow /health and other endpoints to respond
    }
  })();

  return initPromise;
}

// Vercel Serverless Function entrypoint
export default async function handler(req: Request, res: Response) {
  await initOnce();
  return app(req, res);
}

