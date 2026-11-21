// Pengganti whoami.php
import { getSession } from '../../lib/auth.js';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(200).json({ login: false });
    return;
  }
  res.status(200).json({ login: true, nama: session.nama || '', username: session.username || '', role: session.role || 'admin' });
}
