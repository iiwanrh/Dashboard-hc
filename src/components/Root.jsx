import { useState, useEffect } from 'react';
import { whoami } from '../api.js';
import Dashboard from './Dashboard.jsx';
import PublicDashboard from './PublicDashboard.jsx';

export default function Root() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const session = await whoami();
        if (session.login) {
          setIsAdmin(true);
          setUserName(session.nama || session.username || '');
        }
      } catch {
        // Jika sesi tidak dapat diperiksa, tampilkan mode pengunjung.
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return <p className="empty" style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Memuat aplikasi…</p>;
  }

  if (isAdmin) {
    return (
      <Dashboard
        isAdmin
        userName={userName}
        onLoggedIn={(name) => { setIsAdmin(true); setUserName(name || ''); }}
        onLoggedOut={() => { setIsAdmin(false); setUserName(''); }}
      />
    );
  }

  return <PublicDashboard onAdminLogin={(name) => { setIsAdmin(true); setUserName(name || ''); }} />;
}
