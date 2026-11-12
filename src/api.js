// Pengganti pemanggilan login.php / logout.php / whoami.php / api.php di app.js lama.
// Sekarang semua lewat serverless function di /api (lihat folder api/ di root project).
export async function api(t, m, b, id) {
  const r = await fetch(`/api/data?t=${t}${id ? '&id=' + id : ''}`, {
    method: m || 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined,
  });
  if (r.status === 401) {
    const err = new Error('Sesi berakhir');
    err.unauthorized = true;
    throw err;
  }
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}

export async function whoami() {
  const r = await fetch('/api/auth/whoami', { cache: 'no-store' });
  return r.json();
}

export async function login(username, password) {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Login gagal');
  return j;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // abaikan — tetap keluar di sisi client walau request gagal
  }
}
