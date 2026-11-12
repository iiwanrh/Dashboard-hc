import { useState } from 'react';
import { login } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(username.trim(), password);
      onLoggedIn();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div className="login-body">
      <form className="lg-card" onSubmit={submit} autoComplete="on">
        <div className="lg-brand"><i>HC</i><span>Dashboard Human Capital</span></div>
        <div className="lg-err" style={{ display: err ? 'block' : 'none' }}>{err}</div>
        <div className="lg-field">
          <label htmlFor="u">Username</label>
          <input id="u" name="username" type="text" autoComplete="username" required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="lg-field">
          <label htmlFor="p">Password</label>
          <input id="p" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="lg-btn" type="submit" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
        <p className="lg-hint">Hubungi admin HC jika lupa kata sandi.</p>
      </form>
    </div>
  );
}
