// Memeriksa apakah cookie masih dimiliki akun admin yang aktif.
import { getSession, getAdminSession, clearSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  const session = getSession(req);
  if (!session) {
    res.status(200).json({ login: false });
    return;
  }

  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      clearSessionCookie(res);
      res.status(200).json({ login: false });
      return;
    }

    res.status(200).json({
      login: true,
      nama: admin.nama || '',
      username: admin.username || '',
      role: 'admin',
    });
  } catch {
    res.status(503).json({ login: false, error: 'Tidak dapat memeriksa sesi saat ini.' });
  }
}
