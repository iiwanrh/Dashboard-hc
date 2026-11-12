// Koneksi database Postgres (pengganti PDO MySQL di config.php lama).
// Dipakai oleh semua serverless function di folder /api.
import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL belum diatur. Lihat .env.example / README.md.');
    }
    pool = new Pool({
      connectionString,
      // Neon, Vercel Postgres, Supabase dll umumnya mewajibkan SSL.
      ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
