// Pengganti auth.php (session PHP) dengan JWT di cookie httpOnly.
// Serverless function Vercel tidak punya memori/session bersama antar request,
// jadi "sesi login" disimpan di token yang ditandatangani (JWT), bukan di server.
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const COOKIE_NAME = 'hc_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari, sama seperti durasi session PHP yang wajar

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

// Setara require_login() di auth.php lama: hentikan request dengan 401 jika belum login.
// Mengembalikan session jika valid, atau null (dan sudah mengirim respons 401) jika tidak.
export function requireLogin(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Sesi berakhir, silakan login kembali.' });
    return null;
  }
  return session;
}
