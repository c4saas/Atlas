import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';

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
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = getDatabaseUrl();

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('sslmode=require')
});
export const db = drizzle(pool, { schema });
