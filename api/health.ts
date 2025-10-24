import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../server/db";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Health endpoint that verifies DB connectivity when DATABASE_URL is set
  try {
    if (process.env.DATABASE_URL) {
      const { rows } = await pool.query<{ now: string }>("select now() as now");
      return res.status(200).json({ status: "ok", now: rows[0]?.now });
    }
    // Fallback if no DATABASE_URL configured
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    const message = (err as Error)?.message ?? "unknown error";
    return res.status(503).json({ status: "error", message });
  }
}
