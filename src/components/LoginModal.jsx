import { useState } from 'react';
import { login } from '../api.js';

// Modal login admin — dipicu dari tombol "Login Admin" di pojok kanan atas header.
// Dashboard tetap tampil di belakangnya dalam mode pengunjung (read-only).
export default function LoginModal({ onClose, onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const j = await login(username.trim(), password);
      onLoggedIn(j.nama || j.username, j.role);
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Login Admin</h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-sm">✕</button>
        </div>
        {err && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{err}</div>}
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300 mb-3">
          Username
          <input type="text" autoComplete="username" required autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300 mb-4">
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:border-indigo-400">Batal</button>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60">
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>
        </div>
      </form>
    </div>
  );
}
