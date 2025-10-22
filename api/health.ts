import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Lightweight health endpoint for Vercel (does not require full app init)
  res.status(200).json({ status: "ok" });
}

