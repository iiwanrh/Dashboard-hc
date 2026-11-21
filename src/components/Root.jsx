import { useState, useEffect } from 'react';
import { whoami } from '../api.js';
import Dashboard from './Dashboard.jsx';


export default function Root() {
  const [ready, setReady] = useState(false);
  // role: 'visitor' (belum login) | 'admin' | 'superadmin'
  const [role, setRole] = useState('visitor');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const j = await whoami();
        if (j.login) {
          setRole(j.role || 'admin');
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
      role={role}
      userName={userName}
      onLoggedIn={(name, r) => { setRole(r || 'admin'); setUserName(name || ''); }}
      onLoggedOut={() => { setRole('visitor'); setUserName(''); }}
    />
  );
}
