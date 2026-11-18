import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  try {
    // Memo hanya tampil jika admin secara eksplisit menandainya untuk publik
    // dan statusnya sudah Terbit. Memo lama otomatis tetap privat.
    const { rows } = await query(`
      SELECT id, no_memo, tanggal, perihal, tujuan, dari, keterangan
      FROM memo
      WHERE untuk_semua_karyawan = TRUE AND status = 'Terbit'
      ORDER BY tanggal DESC NULLS LAST, id DESC
    `);
    res.status(200).json({ memos: rows });
  } catch (error) {
    console.error('Public memos API error:', error);
    res.status(500).json({ error: 'Memo publik tidak dapat dimuat.' });
  }
}
