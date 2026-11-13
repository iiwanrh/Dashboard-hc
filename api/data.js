// Pengganti api.php — CRUD generik untuk semua tabel dashboard.
import { query } from '../lib/db.js';
import { requireLogin } from '../lib/auth.js';

const TABLES = ['pengaturan', 'karyawan', 'manpower', 'lowongan', 'funnel', 'onboarding', 'kehadiran', 'cuti', 'spd', 'honor', 'surat_tugas', 'lembur', 'lembur_status', 'memo', 'pelanggaran', 'sp'];

async function columnsOf(table) {
  const { rows } = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

export default async function handler(req, res) {
  const m = req.method;
  // Baca data (GET) boleh diakses siapa saja (mode pengunjung / read-only di dashboard).
  // Tambah/ubah/hapus (POST & DELETE) tetap wajib login sebagai admin.
  if (m !== 'GET') {
    const session = requireLogin(req, res);
    if (!session) return; // requireLogin sudah mengirim 401
  }

  try {
    const t = String(req.query.t || '');
    const id = parseInt(req.query.id, 10) || 0;

    if (t === 'all') {
      const out = {};
      for (const x of TABLES) {
        const { rows } = await query(`SELECT * FROM "${x}" ORDER BY id`);
        out[x] = rows;
      }
      res.status(200).json(out);
      return;
    }

    if (!TABLES.includes(t)) throw new Error('Tabel tidak dikenal');

    if (m === 'DELETE') {
      await query(`DELETE FROM "${t}" WHERE id = $1`, [id]);
      res.status(200).json({ ok: true });
      return;
    }

    if (m === 'POST') {
      const inBody = req.body || {};
      const cols = await columnsOf(t);
      const data = {};
      for (const c of cols) {
        if (c !== 'id' && Object.prototype.hasOwnProperty.call(inBody, c)) {
          data[c] = inBody[c] === '' ? null : inBody[c];
        }
      }
      const keys = Object.keys(data);
      if (!keys.length) throw new Error('Tidak ada data');

      if (id) {
        const set = keys.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
        const values = keys.map((c) => data[c]);
        values.push(id);
        await query(`UPDATE "${t}" SET ${set} WHERE id = $${keys.length + 1}`, values);
      } else {
        const names = keys.map((c) => `"${c}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map((c) => data[c]);
        await query(`INSERT INTO "${t}" (${names}) VALUES (${placeholders})`, values);
      }
      res.status(200).json({ ok: true });
      return;
    }

    throw new Error('Metode tidak didukung');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
