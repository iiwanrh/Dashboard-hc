-- Migrasi untuk database yang SUDAH berjalan di production (SUDAH ada data asli).
-- PENTING: JANGAN jalankan ulang schema.sql di database yang sudah berisi data asli —
-- schema.sql berisi DROP TABLE di awal setiap tabel dan akan MENGHAPUS SEMUA DATA.
-- File ini aman dijalankan berkali-kali (idempotent) dan TIDAK menghapus data apa pun.
--
-- Cara pakai: psql "$DATABASE_URL" -f migration_superadmin.sql
-- atau salin-tempel isinya ke SQL editor Neon / Vercel Postgres / Supabase.

-- 1) Pastikan kolom role ada di tabel users (akun lama tanpa kolom ini akan dianggap 'admin').
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';
UPDATE users SET role = 'admin' WHERE role IS NULL;

-- 2) Buat akun Super Admin default kalau belum ada.
--    Username: superadmin   Password: super123
--    GANTI PASSWORD INI setelah login pertama kali (lihat catatan di README).
INSERT INTO users (username, password, nama, role)
SELECT 'superadmin', '$2b$10$4tM5DQsgKa9RRJj288.FU.SXaymyq9dM/F/YoB4xXzXezC9UYLdvC', 'Super Admin', 'superadmin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin');

-- 3) Tabel antrian persetujuan: setiap tambah/ubah/hapus data yang diajukan oleh akun
--    berperan "admin" tercatat di sini (status 'pending') dan baru benar-benar mengubah
--    tabel aslinya setelah Super Admin menyetujui lewat halaman Approval.
CREATE TABLE IF NOT EXISTS approval_requests (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'insert' | 'update' | 'delete'
  record_id INT NULL,
  payload JSONB NULL,
  requested_by VARCHAR(255) NULL,
  requested_at TIMESTAMP DEFAULT now(),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_by VARCHAR(255) NULL,
  reviewed_at TIMESTAMP NULL,
  note VARCHAR(255) NULL
);
