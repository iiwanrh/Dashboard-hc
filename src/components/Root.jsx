import { useState, useEffect } from 'react';
import { whoami } from '../api.js';
import Dashboard from './Dashboard.jsx';

// Dashboard sekarang SELALU tampil ke siapa saja (mode pengunjung/read-only).
// Root hanya memeriksa sekali di awal apakah ada sesi admin yang masih aktif
// (cookie login tersimpan), supaya tombol edit/hapus langsung muncul tanpa
// perlu login ulang. Login sendiri sekarang berupa modal, dipicu dari tombol
// di pojok kanan atas header (lihat Dashboard.jsx / Header.jsx).
export default function Root() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const j = await whoami();
        if (j.login) {
          setIsAdmin(true);
          setUserName(j.nama || j.username || '');
        }
      } catch {
        // abaikan — tetap tampil sebagai pengunjung (read-only)
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return <p className="empty" style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Memuat aplikasi…</p>;
  }

  return (
    <Dashboard
      isAdmin={isAdmin}
      userName={userName}
      onLoggedIn={(name) => { setIsAdmin(true); setUserName(name || ''); }}
      onLoggedOut={() => { setIsAdmin(false); setUserName(''); }}
    />
  );
}
