import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServerApp } from "../_server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getServerApp();
    (app as any)(req, res);
  } catch (err) {
    const message = (err as Error)?.message ?? 'unknown error';
    console.error('csrf-token handler failed:', message);
    res.status(500).json({ error: 'init_failed', message });
  }
}
