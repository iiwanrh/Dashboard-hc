import { useState, useEffect } from 'react';
import { whoami } from '../api.js';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';

// Pengganti pengecekan whoami.php di login.html / redirect ke login.html di app.js
// lama. Sekarang semuanya satu SPA: status login menentukan apakah <Login> atau
// <Dashboard> yang ditampilkan, tanpa reload / pindah halaman HTML.
export default function Root() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'out' | 'in'
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const j = await whoami();
        if (j.login) {
          setUserName(j.nama || j.username);
          setStatus('in');
        } else {
          setStatus('out');
        }
      } catch {
        setStatus('out');
      }
    })();
  }, []);

  if (status === 'checking') {
    return <p className="empty" style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Memuat aplikasi…</p>;
  }
  if (status === 'out') {
    return <Login onLoggedIn={() => { setStatus('checking'); whoami().then((j) => { setUserName(j.nama || j.username); setStatus('in'); }); }} />;
  }
  return <Dashboard userName={userName} onLoggedOut={() => setStatus('out')} />;
}
