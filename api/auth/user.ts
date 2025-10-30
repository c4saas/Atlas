import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getServerApp } from "../_server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getServerApp();
  (app as any)(req, res);
}

