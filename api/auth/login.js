// Login hanya diizinkan untuk akun dengan role admin.
import bcrypt from 'bcryptjs';
import { query } from '../../lib/db.js';
import { signSession, setSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    const u = String(username || '').trim();
    const p = String(password || '');
    if (!u || !p) throw new Error('Username dan password wajib diisi');

    const { rows } = await query(
      'SELECT id, username, password, nama, role FROM users WHERE username = $1 LIMIT 1',
      [u]
    );
    const row = rows[0];
    if (!row || !(await bcrypt.compare(p, row.password))) {
      throw new Error('Username atau password salah');
    }

    if (String(row.role || '').trim().toLowerCase() !== 'admin') {
      res.status(403).json({ error: 'Akun ini tidak memiliki hak akses administrator.' });
      return;
    }

    const nama = row.nama || row.username;
    const role = 'admin';
    const token = signSession({
      uid: row.id,
      username: row.username,
      nama,
      role,
    });
    setSessionCookie(res, token);

    res.status(200).json({ ok: true, nama, username: row.username, role });
  } catch (e) {
    res.status(401).json({ error: e.message || 'Login gagal' });
  }
}
