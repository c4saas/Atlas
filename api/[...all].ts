import type { VercelRequest, VercelResponse } from "@vercel/node";

// Minimal catch-all API for Vercel.
// Note: The full Express app is intentionally not mounted here to avoid
// type-check/build failures unrelated to the health check endpoint.
// Specific endpoints should be implemented as standalone files in /api.

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(404).json({ message: "API route not implemented. Use /api/health." });
}
