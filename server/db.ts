import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import { EMBEDDED_DATABASE_URL } from './db-embedded';

function getDatabaseUrl(): string {
  const replitDbPath = '/tmp/replitdb';

  if (fs.existsSync(replitDbPath)) {
    try {
      const url = fs.readFileSync(replitDbPath, 'utf-8').trim();
      if (url) {
        return url;
      }
    } catch (error) {
      console.warn('Failed to read DATABASE_URL from /tmp/replitdb:', error);
    }
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL as string;
  }

  const embedded = (EMBEDDED_DATABASE_URL || '').trim();
  if (embedded) {
    return embedded;
  }

  throw new Error(
    "DATABASE_URL must be set. Provide it via env, /tmp/replitdb, or EMBEDDED_DATABASE_URL in server/db-embedded.ts",
  );
}

const databaseUrl = getDatabaseUrl();

const sslOption = (() => {
  if (databaseUrl.includes('neon.tech')) return true;
  if (databaseUrl.includes('sslmode=require')) return { rejectUnauthorized: false } as const;
  return undefined;
})();

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslOption as any,
});
export const db = drizzle(pool, { schema });
