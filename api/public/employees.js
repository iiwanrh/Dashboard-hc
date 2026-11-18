import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  try {
    // Hanya tiga kolom yang disetujui untuk direktori pengunjung.
    const { rows } = await query(`
      SELECT nik, nama, departemen
      FROM karyawan
      WHERE status = 'Aktif'
      ORDER BY nama ASC, nik ASC
    `);
    res.status(200).json({ employees: rows });
  } catch (error) {
    console.error('Public employees API error:', error);
    res.status(500).json({ error: 'Direktori karyawan tidak dapat dimuat.' });
  }
}
