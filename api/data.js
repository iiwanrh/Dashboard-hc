// API data internal. Semua pembacaan dan perubahan melalui endpoint ini
// wajib dilakukan oleh admin. Data publik akan disediakan melalui endpoint
// /api/public/* yang terpisah dan hanya mengirim field yang diizinkan.
import { query } from '../lib/db.js';
import { requireAdmin } from '../lib/auth.js';

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
  if (!['GET', 'POST', 'DELETE'].includes(m)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  try {
    const session = await requireAdmin(req, res);
    if (!session) return;

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

    if (!TABLES.includes(t)) {
      res.status(400).json({ error: 'Tabel tidak dikenal' });
      return;
    }

    if (m === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'ID data tidak valid' });
        return;
      }
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
      if (!keys.length) {
        res.status(400).json({ error: 'Tidak ada data untuk disimpan' });
        return;
      }

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
  } catch (e) {
    console.error('API data error:', e);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses data.' });
  }
}
