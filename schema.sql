-- Dashboard HC — skema PostgreSQL (dikonversi dari database.sql MySQL versi XAMPP)
-- Cara pakai: jalankan file ini sekali di database Postgres Anda (Neon / Vercel Postgres / Supabase),
-- misalnya lewat SQL editor mereka, atau: psql "$DATABASE_URL" -f schema.sql
-- atau otomatis lewat: npm run db:init (lihat scripts/init-db.js)

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT now()
);

-- Akun default: username "admin" / password "admin123" — segera ganti password setelah login pertama kali.
INSERT INTO users (username, password, nama, role) VALUES
('admin', '$2b$10$DOIccLwB/o9yR5nSuU8l0OeuhrTenVvopf/SqOnGQTxX78w5UHQRe', 'Administrator HC', 'admin');

DROP TABLE IF EXISTS pengaturan;
CREATE TABLE pengaturan (id SERIAL PRIMARY KEY, kunci VARCHAR(255) NULL, nilai VARCHAR(255) NULL);

-- Tabel karyawan: ditambah kolom perusahaan (PT Amsa / PT Jala), jenis_kelamin,
-- tanggal_lahir (dasar hitung Usia otomatis), pendidikan, dan tanggal_tetap
-- (tanggal resmi jadi pegawai tetap).
DROP TABLE IF EXISTS karyawan;
CREATE TABLE karyawan (
  id SERIAL PRIMARY KEY,
  nik VARCHAR(255) NULL,
  nama VARCHAR(255) NULL,
  perusahaan VARCHAR(50) NULL,
  departemen VARCHAR(255) NULL,
  tipe VARCHAR(255) NULL,
  jenis_kelamin VARCHAR(20) NULL,
  tanggal_lahir DATE NULL,
  pendidikan VARCHAR(20) NULL,
  tgl_masuk DATE NULL,
  tanggal_tetap DATE NULL,
  tgl_resign DATE NULL,
  status VARCHAR(255) NULL,
  jabatan VARCHAR(255) NULL,
  alasan_resign VARCHAR(255) NULL,
  no_kontrak VARCHAR(255) NULL,
  jenis_kontrak VARCHAR(255) NULL,
  mulai_kontrak DATE NULL,
  berakhir DATE NULL
);
DROP TABLE IF EXISTS manpower;
CREATE TABLE manpower (id SERIAL PRIMARY KEY, no_pengajuan VARCHAR(255) NULL, tgl_pengajuan DATE NULL, departemen VARCHAR(255) NULL, posisi VARCHAR(255) NULL, jumlah INT NULL, alasan VARCHAR(255) NULL, pemohon VARCHAR(255) NULL, status VARCHAR(255) NULL, tgl_keputusan DATE NULL);
DROP TABLE IF EXISTS lowongan;
CREATE TABLE lowongan (id SERIAL PRIMARY KEY, posisi VARCHAR(255) NULL, departemen VARCHAR(255) NULL, tgl_buka DATE NULL, kebutuhan INT NULL, pelamar INT NULL, diterima INT NULL, status VARCHAR(255) NULL, target_selesai DATE NULL);
DROP TABLE IF EXISTS funnel;
CREATE TABLE funnel (id SERIAL PRIMARY KEY, tahap VARCHAR(255) NULL, jumlah INT NULL);
DROP TABLE IF EXISTS onboarding;
CREATE TABLE onboarding (id SERIAL PRIMARY KEY, nama VARCHAR(255) NULL, posisi VARCHAR(255) NULL, divisi VARCHAR(255) NULL, tgl_onboarding DATE NULL, tgl_mulai DATE NULL, pj VARCHAR(255) NULL, status VARCHAR(255) NULL, keterangan VARCHAR(255) NULL);
DROP TABLE IF EXISTS kehadiran;
CREATE TABLE kehadiran (id SERIAL PRIMARY KEY, bulan DATE NULL, hari_kerja INT NULL, masuk INT NULL, izin_sakit INT NULL, cuti INT NULL, dinas INT NULL, keterangan VARCHAR(255) NULL);
-- Tabel cuti & lembur* tetap dipertahankan (data tidak dihapus) walau tabel
-- "Rekapan Cuti Karyawan" dan fitur Upah Lembur sudah tidak ditampilkan di UI.
DROP TABLE IF EXISTS cuti;
CREATE TABLE cuti (id SERIAL PRIMARY KEY, tgl_pengajuan DATE NULL, nik VARCHAR(255) NULL, jenis_cuti VARCHAR(255) NULL, mulai DATE NULL, selesai DATE NULL, status VARCHAR(255) NULL, keterangan VARCHAR(255) NULL);
DROP TABLE IF EXISTS spd;
CREATE TABLE spd (id SERIAL PRIMARY KEY, no_surat VARCHAR(255) NULL, tgl_surat DATE NULL, nik VARCHAR(255) NULL, kota VARCHAR(255) NULL, berangkat DATE NULL, kembali DATE NULL, keperluan VARCHAR(255) NULL);
DROP TABLE IF EXISTS honor;
CREATE TABLE honor (id SERIAL PRIMARY KEY, no_spd VARCHAR(255) NULL, nominal DECIMAL(15,0) NULL, tgl_pengajuan DATE NULL, status VARCHAR(255) NULL, tgl_dibayar DATE NULL, keterangan VARCHAR(255) NULL);
DROP TABLE IF EXISTS surat_tugas;
CREATE TABLE surat_tugas (id SERIAL PRIMARY KEY, no_surat VARCHAR(255) NULL, tanggal DATE NULL, nik VARCHAR(255) NULL, tujuan VARCHAR(255) NULL, mulai DATE NULL, selesai DATE NULL);
DROP TABLE IF EXISTS lembur;
CREATE TABLE lembur (id SERIAL PRIMARY KEY, no_surat VARCHAR(255) NULL, tanggal DATE NULL, nik VARCHAR(255) NULL, jam_mulai TIME NULL, jam_selesai TIME NULL, hari_lembur VARCHAR(255) NULL);
DROP TABLE IF EXISTS lembur_status;
CREATE TABLE lembur_status (id SERIAL PRIMARY KEY, tanggal VARCHAR(255) NULL, status VARCHAR(255) NULL, tgl_pengajuan DATE NULL);
DROP TABLE IF EXISTS memo;
CREATE TABLE memo (id SERIAL PRIMARY KEY, no_memo VARCHAR(255) NULL, tanggal DATE NULL, perihal VARCHAR(255) NULL, tujuan VARCHAR(255) NULL, dari VARCHAR(255) NULL, status VARCHAR(255) NULL, keterangan VARCHAR(255) NULL);
DROP TABLE IF EXISTS pelanggaran;
CREATE TABLE pelanggaran (id SERIAL PRIMARY KEY, no_plg VARCHAR(255) NULL, tanggal DATE NULL, nik VARCHAR(255) NULL, jenis VARCHAR(255) NULL, kategori VARCHAR(255) NULL, uraian VARCHAR(255) NULL, tindak_lanjut VARCHAR(255) NULL);
DROP TABLE IF EXISTS sp;
CREATE TABLE sp (id SERIAL PRIMARY KEY, no_sp VARCHAR(255) NULL, nik VARCHAR(255) NULL, jenis_sp VARCHAR(255) NULL, tgl_terbit DATE NULL, masa_berlaku INT NULL, no_pelanggaran VARCHAR(255) NULL);

INSERT INTO pengaturan (kunci, nilai) VALUES
('basis_manual', '277');

INSERT INTO karyawan (nik, nama, perusahaan, departemen, tipe, jenis_kelamin, tanggal_lahir, pendidikan, tgl_masuk, tanggal_tetap, tgl_resign, status, jabatan, alasan_resign, no_kontrak, jenis_kontrak, mulai_kontrak, berakhir) VALUES
('EMP001','Andi Pratama','PT Amsa','PPIC','Tetap','Laki-laki','1992-05-14','S1','2022-03-01','2023-03-01',NULL,'Aktif','Sales Executive',NULL,NULL,NULL,NULL,NULL),
('EMP002','Siti Aisyah','PT Amsa','Production Assembly','Tetap','Perempuan','1990-08-22','D3','2021-07-15','2022-07-15',NULL,'Aktif','Marketing Specialist',NULL,NULL,NULL,NULL,NULL),
('EMP004','Rina Kartika','PT Amsa','Finance & Accounting','Tetap','Perempuan','1988-02-10','S1','2020-05-02','2021-05-02',NULL,'Aktif','Staff Accounting',NULL,NULL,NULL,NULL,NULL),
('EMP005','Dimas Setiawan','PT Amsa','Production Assembly','Tetap','Laki-laki','1991-11-30','S1','2024-02-19','2025-02-19',NULL,'Aktif','Supervisor Assembly',NULL,NULL,NULL,NULL,NULL),
('EMP009','Hendra Wijaya','PT Amsa','General Affairs','Tetap','Laki-laki','1989-04-18','SMA/SMK','2023-09-04','2024-09-04','2026-09-30','Resign','Sales Executive','Mengundurkan diri',NULL,NULL,NULL,NULL),
('EMP010','Laras Ayu','PT Jala','Intelegent System Engineering','Tetap','Perempuan','1996-01-25','S1','2024-11-11','2025-11-11','2026-06-15','Resign','UI/UX Designer','Pindah domisili',NULL,NULL,NULL,NULL),
('EMP012','Naruto','PT Jala','QA & QC','Tetap','Laki-laki','1998-10-10','SMA/SMK','2026-04-02',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP003','Budi Santoso','PT Jala','Intelegent System Engineering','Kontrak','Laki-laki','1994-03-03','S1','2025-12-01',NULL,NULL,'Aktif','Software Engineer',NULL,'KK/HC/2025/012','PKWT','2025-12-01','2026-11-30'),
('EMP007','Fajar Nugroho','PT Jala','Production Engineering','Kontrak','Laki-laki','1997-07-07','SMA/SMK','2026-08-10',NULL,NULL,'Aktif','Staff Produksi',NULL,'KK/HC/2026/003','PKWT','2026-08-10','2027-08-09'),
('EMP008','Nadia Putri','PT Amsa','General Affairs','Kontrak','Perempuan','1999-09-09','S1','2026-01-05',NULL,NULL,'Aktif','Content Creator',NULL,'KK/HC/2026/001','PKWT','2026-01-05','2026-12-31'),
('EMP013','Sakura','PT Jala','Product Support','Kontrak','Perempuan','2000-03-28','S1','2026-04-03',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP015','Lee','PT Amsa','Production Assembly','Kontrak','Laki-laki','1999-06-06','SMA/SMK','2026-04-05',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP016','Neji','PT Amsa','General Affairs','Kontrak','Laki-laki','1998-12-12','S1','2026-04-06',NULL,NULL,'Aktif','fgfg',NULL,NULL,NULL,NULL,NULL),
('EMP017','Tenten','PT Amsa','Finance & Accounting','Kontrak','Perempuan','1999-02-02','D3','2026-04-07',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP018','Shika','PT Amsa','Human Capital','Kontrak','Laki-laki','1995-05-05','S2','2026-04-08',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP019','Choji','PT Jala','Intelegent System Engineering','Kontrak','Laki-laki','1997-08-08','SMA/SMK','2026-04-09',NULL,NULL,'Aktif','vbvb',NULL,NULL,NULL,NULL,NULL),
('EMP020','Ino','PT Jala','Production Engineering','Kontrak','Perempuan','1998-04-04','S1','2026-04-10',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP021','Shino','PT Amsa','Finance & Accounting','Kontrak','Laki-laki','1996-09-09','S1','2026-04-11',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP022','Hinata','PT Jala','Production Fabrication','Kontrak','Perempuan','1999-01-11','D3','2026-04-12',NULL,NULL,'Aktif','ttyyy',NULL,NULL,NULL,NULL,NULL),
('EMP023','Kiba','PT Jala','Product Development','Kontrak','Laki-laki','1997-02-20','SMA/SMK','2026-04-13',NULL,NULL,'Aktif','vbyt',NULL,NULL,NULL,NULL,NULL),
('EMP024','Garra','PT Jala','Design Engineering','Kontrak','Laki-laki','1996-06-16','S1','2026-04-14',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP025','Kankuro','PT Jala','Procurement','Kontrak','Laki-laki','1995-10-05','SMA/SMK','2026-04-15',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP026','Temari','PT Jala','Board of Directors (Staff Ahli)','Kontrak','Perempuan','1993-12-21','S2','2026-04-16',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP027','Sai','PT Amsa','Secretary','Kontrak','Laki-laki','1997-11-11','S1','2026-04-17',NULL,NULL,'Aktif','popo',NULL,NULL,NULL,NULL,NULL),
('EMP028','Kakashi','PT Jala','Product Support','Kontrak','Laki-laki','1985-09-15','S2','2026-04-18',NULL,NULL,'Aktif','ooqa',NULL,NULL,NULL,NULL,NULL),
('EMP011','Yoga Pratama','PT Amsa','Production Assembly','PHL','Laki-laki','2000-05-25','SMA/SMK','2026-04-01',NULL,NULL,'Aktif','Operator Produksi',NULL,NULL,NULL,NULL,NULL),
('EMP014','Sakura','PT Amsa','PPIC','PHL','Perempuan','2001-07-19','SMA/SMK','2026-04-04',NULL,NULL,'Aktif',NULL,NULL,NULL,NULL,NULL,NULL),
('EMP006','Maya Lestari','PT Amsa','Human Capital','PHL','Perempuan','1994-01-30','S1','2026-03-02',NULL,NULL,'Aktif','HR Generalist',NULL,NULL,NULL,NULL,NULL);

INSERT INTO manpower (no_pengajuan, tgl_pengajuan, departemen, posisi, jumlah, alasan, pemohon, status, tgl_keputusan) VALUES
('MP-2026-001','2026-10-05','PPIC','Operator Produksi',3,'Ekspansi lini produksi','Kepala PPIC','Diterima','2026-10-12'),
('MP-2026-002','2026-10-20','General Affairs','Staff GA',2,'Penggantian karyawan resign','Kepala GA','Ditolak','2026-10-27'),
('MP-2026-003','2026-11-03','Finance & Accounting','Staff Accounting',1,'Cuti melahirkan','Kepala Finance','Diajukan',NULL),
('MP-2026-004','2026-12-04','Intelegent System Engineering','Software',3,'lebih banyak karyawan','Kepala IT','Diterima','2027-10-22');

INSERT INTO lowongan (posisi, departemen, tgl_buka, kebutuhan, pelamar, diterima, status, target_selesai) VALUES
('PPIC','PPIC','2026-10-01',2,45,0,'Open','2026-11-30'),
('Software Engineer','Intelegent System Engineering','2026-09-15',4,60,0,'On Progress','2026-12-15'),
('GA','General Affairs','2026-10-20',3,28,1,'On Progress','2026-12-15'),
('Payroll','Finance & Accounting','2026-08-01',1,52,1,'Closed','2026-09-10'),
('Staff Accounting','Finance & Accounting','2026-11-02',1,12,0,'Open','2026-12-01');

INSERT INTO funnel (tahap, jumlah) VALUES
('Pelamar (Screening)',8),
('Psikotest',7),
('Interview HR',6),
('Interview User',4),
('Diterima',2);

INSERT INTO onboarding (nama, posisi, divisi, tgl_onboarding, tgl_mulai, pj, status, keterangan) VALUES
('Fikri Ramadhan','Software Engineer','Intelegent System Engineering','2026-11-23','2026-12-01','Human Capital','Terjadwal','Pengenalan sistem & tools'),
('Hafiz Akbar','Payroll','Finance & Accounting','2026-11-09','2026-11-16','Human Capital','Selesai','Human Capital');

INSERT INTO kehadiran (bulan, hari_kerja, masuk, izin_sakit, cuti, dinas, keterangan) VALUES
('2026-10-01',26,6300,300,40,25,NULL),
('2026-11-01',22,5100,230,35,20,NULL),
('2026-12-01',26,7202,0,0,0,NULL);

INSERT INTO cuti (tgl_pengajuan, nik, jenis_cuti, mulai, selesai, status, keterangan) VALUES
('2026-10-20','EMP004','Tahunan','2026-11-04','2026-11-06','Disetujui',NULL),
('2026-10-28','EMP001','Tahunan','2026-12-20','2026-12-24','Diajukan',NULL),
('2026-11-02','EMP003','Tahunan','2026-11-16','2026-11-17','Disetujui',NULL);

INSERT INTO spd (no_surat, tgl_surat, nik, kota, berangkat, kembali, keperluan) VALUES
('SPD-001','2026-10-27','EMP011','Cirebon','2026-10-27','2026-10-28','Pengiriman material'),
('SPD-002','2026-11-04','EMP011','Purwakarta','2026-11-04','2026-11-06','Pengawasan pemasangan line'),
('SPD-003','2026-11-01','EMP001','Surabaya','2026-10-28','2026-10-30','Presentasi klien'),
('SPD-004','2026-11-04','EMP003','Yogyakarta','2026-11-10','2026-11-13','Pengantaran Maung');

INSERT INTO honor (no_spd, nominal, tgl_pengajuan, status, tgl_dibayar, keterangan) VALUES
('SPD-003',1850000,'2026-11-02','Dibayar','2026-11-10',NULL),
('SPD-004',2400000,'2026-11-14','Diajukan',NULL,NULL),
('SPD-001',850000,NULL,'Belum diajukan',NULL,'Tunggu bukti kwitansi');

INSERT INTO surat_tugas (no_surat, tanggal, nik, tujuan, mulai, selesai) VALUES
('ST-001','2026-10-28','EMP005','Kunjungan cabang Bekasi','2026-11-03','2026-11-05'),
('ST-002','2026-11-04','EMP002','Pameran produk Tangerang','2026-11-10','2026-11-12'),
('ST-003','2026-11-05','EMP007','Monitoring gudang Cikarang','2026-11-06','2026-11-06'),
('ST-004','2026-11-06','EMP003','Pengadaan bahan Depok','2026-11-06','2026-11-07'),
('ST-005','2026-11-06','EMP001','aya Weh','2026-11-06','2026-11-07');

INSERT INTO lembur (no_surat, tanggal, nik, jam_mulai, jam_selesai, hari_lembur) VALUES
('SPL-001','2026-11-02','EMP002','17:00:00','20:00:00','Hari Kerja'),
('SPL-002','2026-11-02','EMP005','17:00:00','21:00:00','Hari Kerja'),
('SPL-003','2026-11-03','EMP007','08:00:00','14:00:00','Sabtu'),
('SPL-004','2026-11-04','EMP003','17:30:00','19:30:00','Hari Kerja'),
('SPL-005','2026-11-05','EMP006','18:00:00','22:00:00','Hari Kerja'),
('SPL-006','2026-11-06','EMP002','08:00:00','12:00:00','Minggu'),
('SPL-007','2026-11-06','EMP001','18:00:00','21:00:00','Sabtu');

INSERT INTO lembur_status (tanggal, status, tgl_pengajuan) VALUES
('2026-11-02','Dibayar',NULL),
('2026-11-03','Belum diajukan',NULL),
('2026-11-04','Belum diajukan',NULL),
('2026-11-05','Belum diajukan',NULL),
('2026-11-06','Diajukan',NULL),
('TOTAL',NULL,NULL);

INSERT INTO memo (no_memo, tanggal, perihal, tujuan, dari, status, keterangan) VALUES
('MEMO/HC/XI/2026/001','2026-11-02','Perubahan jam operasional','Seluruh Karyawan','HC','Terbit',NULL),
('MEMO/HC/XI/2026/002','2026-11-04','Jadwal pelatihan K3','Seluruh Karyawan','HC','Terbit',NULL),
('MEMO/HC/XI/2026/003','2026-11-05','Kebijakan kerja hybrid','Seluruh Karyawan','HC','Draft','Menunggu persetujuan direksi'),
('MEMO/HC/XI/2026/004','2026-11-06','cuti','Seluruh Karyawan','HC','Terbit','aman');

INSERT INTO pelanggaran (no_plg, tanggal, nik, jenis, kategori, uraian, tindak_lanjut) VALUES
('PLG-001','2026-10-03','EMP007','Terlambat berulang (3x dalam sebulan)','Ringan','Terlambat 3 kali dalam satu bulan','Teguran lisan'),
('PLG-002','2026-10-15','EMP008','Tidak masuk tanpa keterangan','Sedang','2 hari tidak masuk tanpa keterangan','SP1 (SP-001)'),
('PLG-003','2026-10-22','EMP003','Pelanggaran kebijakan keamanan data','Berat','Membagikan dokumen internal ke pihak luar','Proses investigasi');

INSERT INTO sp (no_sp, nik, jenis_sp, tgl_terbit, masa_berlaku, no_pelanggaran) VALUES
('SP-001','EMP008','SP1','2026-10-16',6,'PLG-002'),
('SP-002','EMP002','SP1','2025-04-01',6,'Keterlambatan (arsip)');
