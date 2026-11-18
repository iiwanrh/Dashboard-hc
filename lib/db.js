// Koneksi database PostgreSQL.
// Preview menggunakan database pengujian.
// Production tetap menggunakan database utama.

import pg from 'pg';

const { Pool } = pg;

let pool;

function getConnectionString() {
  const environment = process.env.VERCEL_ENV;

  // Deployment Preview di Vercel
  if (environment === 'preview') {
    const testUrl = process.env.DATABASE_URL_TEST;

    if (!testUrl) {
      throw new Error(
        'DATABASE_URL_TEST belum diatur untuk environment Preview.'
      );
    }

    return testUrl;
  }

  // Deployment Production di Vercel
  if (environment === 'production') {
    const productionUrl = process.env.DATABASE_URL;

    if (!productionUrl) {
      throw new Error('DATABASE_URL belum diatur untuk Production.');
    }

    return productionUrl;
  }

  // Pengembangan lokal
  const localUrl =
    process.env.DATABASE_URL_TEST ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!localUrl) {
    throw new Error('Variabel koneksi database belum diatur.');
  }

  return localUrl;
}

export function getPool() {
  if (!pool) {
    const connectionString = getConnectionString();

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=disable')
        ? false
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
