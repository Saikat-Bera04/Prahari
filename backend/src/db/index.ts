import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { getConfig } from '../config/index.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function initDatabase() {
  const config = getConfig();
  
  const isNeon = config.DATABASE_URL?.includes('neon.tech');

  pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  db = drizzle(pool);
  
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  return db;
}

export function getDb() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function getPool() {
  if (!pool) {
    initDatabase();
  }
  return pool!;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}