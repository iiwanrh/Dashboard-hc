// Logout hanya menerima POST.
import { clearSessionCookie } from '../../lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}