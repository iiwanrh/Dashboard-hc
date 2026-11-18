// Autentikasi berbasis JWT dalam cookie httpOnly.
// Hak admin selalu diverifikasi kembali ke database agar perubahan role
// atau penghapusan akun berlaku meskipun token lama masih tersimpan.
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { query } from './db.js';

const COOKIE_NAME = 'hc_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET belum diatur. Lihat .env.example / README.md.');
  return s;
}

export function signSession(payload) {
  return jwt.sign(payload, secret(), { expiresIn: MAX_AGE });
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  }));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }));
}

export function getSession(req) {
  const raw = req.headers.cookie || '';
  const parsed = cookie.parse(raw);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

// Mengembalikan sesi hanya jika akun masih ada dan role-nya benar-benar admin.
export async function getAdminSession(req) {
  const session = getSession(req);
  if (!session || !session.uid) return null;

  const { rows } = await query(
    'SELECT id, username, nama, role FROM users WHERE id = $1 LIMIT 1',
    [session.uid]
  );
  const user = rows[0];
  if (!user || String(user.role || '').trim().toLowerCase() !== 'admin') {
    return null;
  }

  return {
    ...session,
    uid: user.id,
    username: user.username,
    nama: user.nama || user.username,
    role: 'admin',
  };
}

// Hentikan request yang bukan admin dengan 401 (belum login) atau 403 (bukan admin).
export async function requireAdmin(req, res) {
  const existingSession = getSession(req);
  if (!existingSession) {
    res.status(401).json({ error: 'Silakan login sebagai admin.' });
    return null;
  }

  const adminSession = await getAdminSession(req);
  if (!adminSession) {
    res.status(403).json({ error: 'Akses ditolak. Akun ini bukan administrator.' });
    return null;
  }

  return adminSession;
}
