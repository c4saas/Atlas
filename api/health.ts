import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";
import { EMBEDDED_DATABASE_URL } from "../server/db-embedded";

// Create the pool lazily so the function doesn't crash
// if DATABASE_URL is missing in the environment.
let pool: Pool | null = null;
function getPool(): Pool | null {
  const url = (process.env.DATABASE_URL || EMBEDDED_DATABASE_URL || "").trim();
  if (!url) return null;
  if (!pool) {
    const ssl = url.includes("neon.tech")
      ? true
      : url.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined;
    pool = new Pool({ connectionString: url, ssl: ssl as any });
  }
  return pool;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Health endpoint that verifies DB connectivity when DATABASE_URL is set
  try {
    const p = getPool();
    if (p) {
      const { rows } = await p.query<{ now: string }>("select now() as now");
      return res.status(200).json({ status: "ok", now: rows[0]?.now });
    }
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    const message = (err as Error)?.message ?? "unknown error";
    return res.status(503).json({ status: "error", message });
  }
}
