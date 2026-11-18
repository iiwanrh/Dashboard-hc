-- Jalankan hanya pada Neon branch hc-testing terlebih dahulu.
-- Kolom baru default FALSE agar memo lama tidak otomatis menjadi publik.
ALTER TABLE memo
ADD COLUMN IF NOT EXISTS untuk_semua_karyawan BOOLEAN NOT NULL DEFAULT FALSE;
