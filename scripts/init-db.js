// Menjalankan schema.sql ke database Postgres yang ditunjuk oleh DATABASE_URL.
// Pakai: npm run db:init  (pastikan sudah mengisi DATABASE_URL di .env atau environment)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('DATABASE_URL belum diatur. Set env var ini dulu (lihat .env.example), lalu jalankan ulang.');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log('Skema & data contoh berhasil dibuat di database.');
} catch (e) {
  console.error('Gagal menjalankan schema.sql:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
