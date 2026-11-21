// Endpoint khusus Super Admin: menyetujui atau menolak pengajuan tambah/ubah/hapus
// data yang dibuat oleh akun "admin" (lihat api/data.js — admin tidak pernah menulis
// langsung ke tabel, hanya membuat baris "pending" di approval_requests).
// Daftar pengajuan sendiri sudah ikut dikirim lewat /api/data?t=all (field "approvals"),
// jadi file ini hanya menangani aksi approve/reject (POST).
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }
  const session = requireLogin(req, res);
  if (!session) return;
  if ((session.role || 'admin') !== 'superadmin') {
    res.status(403).json({ error: 'Hanya Super Admin yang dapat menyetujui/menolak pengajuan.' });
    return;
  }

  try {
    const { id, action, note } = req.body || {};
    const reqId = parseInt(id, 10) || 0;
    if (!reqId) throw new Error('ID pengajuan tidak valid');
    if (action !== 'approve' && action !== 'reject') throw new Error('Aksi tidak dikenal');

    const { rows } = await query('SELECT * FROM approval_requests WHERE id = $1', [reqId]);
    const r = rows[0];
    if (!r) throw new Error('Pengajuan tidak ditemukan');
    if (r.status !== 'pending') throw new Error('Pengajuan ini sudah diproses sebelumnya');
    if (!TABLES.includes(r.table_name)) throw new Error('Tabel tidak dikenal pada pengajuan ini');

    if (action === 'reject') {
      await query(
        `UPDATE approval_requests SET status='rejected', reviewed_by=$1, reviewed_at=now(), note=$2 WHERE id=$3`,
        [session.username, note || null, reqId]
      );
      res.status(200).json({ ok: true, status: 'rejected' });
      return;
    }

    // action === 'approve' -> jalankan perubahan sebenarnya ke tabel aslinya sekarang
    const t = r.table_name, payload = r.payload || {};
    if (r.action === 'delete') {
      await query(`DELETE FROM "${t}" WHERE id = $1`, [r.record_id]);
    } else {
      const cols = await columnsOf(t);
      const data = {};
      for (const c of cols) {
        if (c !== 'id' && Object.prototype.hasOwnProperty.call(payload, c)) data[c] = payload[c];
      }
      const keys = Object.keys(data);
      if (!keys.length) throw new Error('Pengajuan ini tidak memiliki data untuk disimpan');
      if (r.action === 'update' && r.record_id) {
        const set = keys.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
        const values = keys.map((c) => data[c]);
        values.push(r.record_id);
        await query(`UPDATE "${t}" SET ${set} WHERE id = $${keys.length + 1}`, values);
      } else {
        const names = keys.map((c) => `"${c}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map((c) => data[c]);
        await query(`INSERT INTO "${t}" (${names}) VALUES (${placeholders})`, values);
      }
    }

    await query(
      `UPDATE approval_requests SET status='approved', reviewed_by=$1, reviewed_at=now(), note=$2 WHERE id=$3`,
      [session.username, note || null, reqId]
    );
    res.status(200).json({ ok: true, status: 'approved' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
