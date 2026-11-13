# Dashboard Human Capital (versi Vercel: React + Node.js + Postgres)

Ini adalah hasil rombak dari versi PHP + MySQL (XAMPP) supaya bisa di-hosting
gratis di **Vercel**. Vercel tidak menjalankan PHP, jadi:

| Lama (PHP/XAMPP)                         | Baru (Vercel)                                   |
|-------------------------------------------|--------------------------------------------------|
| `login.php`, `logout.php`, `whoami.php`   | `api/auth/login.js`, `logout.js`, `whoami.js`     |
| `api.php` (CRUD semua tabel)              | `api/data.js`                                     |
| Session PHP (`$_SESSION`)                 | Token JWT di cookie `httpOnly` (sebab serverless function tidak punya memori bersama antar-request) |
| MySQL (`database.sql`)                    | PostgreSQL (`schema.sql`) — isi datanya sama persis |
| `index.html` + `app.js` (tanpa build)     | Project React (Vite) di folder `src/`             |
| `assets/vendor/*.js` (library lokal)      | Dependensi npm biasa (`package.json`)             |

**Semua rumus, label, dan tampilan dashboard TIDAK diubah** — hanya cara
hosting & penyimpanan datanya yang berubah supaya kompatibel dengan Vercel.

## Mode pengunjung & mode admin

Sejak revisi ini, dashboard **langsung tampil ke siapa saja** yang membuka
link-nya, dalam mode **read-only** (tidak ada tombol Tambah/Ubah/Hapus/Impor).
Di pojok kanan atas header ada tombol **🔑 Login Admin** — setelah login
dengan akun di tabel `users`, tombol-tombol edit akan muncul dan data bisa
diubah/dihapus, sampai tombol **🚪 Keluar** ditekan atau sesi login berakhir.

Secara teknis: `api/data.js` sekarang mengizinkan `GET` (baca data) tanpa
login, tapi `POST`/`DELETE` (tambah/ubah/hapus) tetap wajib login — jadi
pengunjung tanpa akun tidak bisa mengubah data walau mencoba memanggil API
secara langsung.

## 1. Siapkan database PostgreSQL

Pakai salah satu (gratis untuk skala kecil): [Neon](https://neon.tech),
[Vercel Postgres](https://vercel.com/storage/postgres), atau
[Supabase](https://supabase.com).

1. Buat database baru, salin **connection string**-nya (biasanya diawali
   `postgres://...` atau `postgresql://...`).
2. Jalankan `schema.sql` ke database tersebut untuk membuat semua tabel +
   data contoh (karyawan, lowongan, dll — sama seperti isi `database.sql`
   lama). Cara paling gampang: tempel isi `schema.sql` ke SQL editor bawaan
   Neon/Supabase, atau jalankan dari komputer Anda:

   ```bash
   # cara 1: pakai psql
   psql "postgres://...connection-string-anda..." -f schema.sql

   # cara 2: pakai script yang sudah disediakan (butuh Node.js + npm install dulu)
   export DATABASE_URL="postgres://...connection-string-anda..."
   npm install
   npm run db:init
   ```

## 2. Jalankan di komputer sendiri (opsional, untuk coba-coba dulu)

```bash
npm install
cp .env.example .env     # lalu isi DATABASE_URL dan JWT_SECRET di file .env
npx vercel dev            # menjalankan frontend + /api sekaligus, http://localhost:3000
```

(`npm run dev` saja hanya menjalankan frontend Vite; folder `/api` butuh
`vercel dev` atau sudah di-deploy ke Vercel supaya berfungsi.)

## 3. Deploy ke Vercel

1. Push folder ini ke sebuah repo GitHub.
2. Di [vercel.com](https://vercel.com) → **Add New Project** → pilih repo
   tersebut. Vercel otomatis mendeteksi Vite.
3. Di tab **Environment Variables**, tambahkan:
   - `DATABASE_URL` = connection string Postgres dari langkah 1
   - `JWT_SECRET` = string acak & rahasia (boleh generate dengan
     `openssl rand -base64 48`)
4. Klik **Deploy**. Selesai — dashboard bisa diakses di domain `*.vercel.app`
   yang diberikan Vercel (atau domain kustom Anda).

## Login default

- Username: `admin`
- Password: `admin123`

**Segera ganti password ini** setelah login pertama kali (lewat tabel
`users` langsung di database — saat ini belum ada halaman ubah password di
UI, sama seperti versi PHP sebelumnya).

## Struktur folder

```
api/                 → Serverless functions (backend), jalan di Node.js
  auth/login.js       → ganti login.php
  auth/logout.js      → ganti logout.php
  auth/whoami.js      → ganti whoami.php
  data.js             → ganti api.php (CRUD semua tabel)
lib/
  db.js               → koneksi Postgres
  auth.js             → bikin & cek token JWT (pengganti session PHP)
src/                  → frontend React (Vite)
  core.js             → seluruh rumus & definisi tabel/kolom (porting app.js)
  api.js              → pemanggil endpoint /api dari frontend
  components/         → Header, NotifButton, RecordModal, Login, Dashboard
schema.sql            → skema + data contoh PostgreSQL (pengganti database.sql)
scripts/init-db.js    → jalankan schema.sql otomatis lewat `npm run db:init`
```

## Menambah pengguna baru

Belum ada halaman "tambah user" di UI. Untuk sekarang, tambahkan baris baru
ke tabel `users` langsung lewat SQL editor database Anda, dengan password
yang sudah di-hash bcrypt, misalnya lewat Node:

```js
node -e "console.log(require('bcryptjs').hashSync('password-baru', 10))"
```

lalu:

```sql
INSERT INTO users (username, password, nama, role)
VALUES ('username_baru', '<hasil hash di atas>', 'Nama Lengkap', 'admin');
```
