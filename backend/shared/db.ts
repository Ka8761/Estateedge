
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// const pool = new Pool({
//   host: process.env.POSTGRES_HOST ?? 'localhost',
//   port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
//   database: process.env.POSTGRES_DB ?? 'postgres',
//   user: process.env.POSTGRES_USER ?? 'postgres',
//   password: process.env.POSTGRES_PASSWORD ?? 'estateedge_secret',
//   max: parseInt(process.env.POSTGRES_POOL_MAX ?? '20'),
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 5000,
//   ssl: process.env.NODE_ENV === 'production'
//     ? { rejectUnauthorized: true }
//     : false,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.POSTGRES_POOL_MAX ?? '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected pool error', err);
});

pool.on('connect', () => {
  console.log('[PostgreSQL] New client connected to pool');
});

// ─── Query Helpers ────────────────────────────────────────────────────────────

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[PostgreSQL] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return result;
  } catch (err) {
    console.error('[PostgreSQL] Query error:', { text: text.substring(0, 200), err });
    throw err;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

// ─── Transaction Helper ───────────────────────────────────────────────────────

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function checkDbHealth(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

export async function closeDb(): Promise<void> {
  await pool.end();
  console.log('[PostgreSQL] Pool closed');
}

process.on('SIGTERM', closeDb);
process.on('SIGINT', closeDb);

export { pool };