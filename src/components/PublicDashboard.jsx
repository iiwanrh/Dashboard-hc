import { useEffect, useState } from 'react';
import LoginModal from './LoginModal.jsx';

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Permintaan gagal');
  return data;
}

const number = (value) => Number(value || 0).toLocaleString('id-ID');
const date = (value) => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—';

export default function PublicDashboard({ onAdminLogin }) {
  const [route, setRoute] = useState(() => {
    const initial = location.hash.slice(2);
    return ['public_dashboard', 'public_employees', 'public_memos'].includes(initial) ? initial : 'public_dashboard';
  });
  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [memos, setMemos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const onHash = () => {
      const next = location.hash.slice(2);
      setRoute(['public_dashboard', 'public_employees', 'public_memos'].includes(next) ? next : 'public_dashboard');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    if (!location.hash) location.hash = '/public_dashboard';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const request = route === 'public_employees'
      ? getJson('/api/public/employees').then((data) => { if (!cancelled) setEmployees(data.employees || []); })
      : route === 'public_memos'
        ? getJson('/api/public/memos').then((data) => { if (!cancelled) setMemos(data.memos || []); })
        : getJson('/api/public/dashboard').then((data) => {if (!cancelled) setDashboard(data);});
        
    request.catch((e) => { if (!cancelled) setError(e.message || 'Gagal memuat data'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [route]);

  const nav = [
    ['public_dashboard', '📊 Dashboard'],
    ['public_employees', '👥 Direktori Karyawan'],
    ['public_memos', '📄 Memo Karyawan'],
  ];

  const visibleEmployees = (employees || []).filter((person) =>
    [person.nik, person.nama, person.departemen].some((value) =>
      String(value || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  function BarList({ items }) {
    const max = Math.max(1, ...items.map((item) => Number(item.total || 0)));
    return (
      <div className="card">
        <div className="ch"><h3>Headcount Karyawan Aktif per Departemen</h3></div>
        {items.length ? items.map((item) => (
          <div key={item.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 3fr 42px', gap: 10, alignItems: 'center', margin: '12px 0' }}>
            <span style={{ fontSize: 13 }}>{item.name}</span>
            <div style={{ height: 10, background: 'var(--l)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ width: `${Number(item.total || 0) / max * 100}%`, height: '100%', background: 'var(--p)', borderRadius: 20 }} />
            </div>
            <strong style={{ textAlign: 'right' }}>{number(item.total)}</strong>
          </div>
        )) : <p className="empty">Belum ada data departemen.</p>}
      </div>
    );
  }

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'linear-gradient(90deg,#312e81,#4f46e5)', color: '#fff', boxShadow: '0 2px 12px #0003' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a href="#/public_dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700 }}>
            <span style={{ background: '#fff', color: '#4338ca', borderRadius: 8, padding: '4px 9px' }}>HC</span>
            Human Capital
          </a>
          <nav style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {nav.map(([key, label]) => (
              <a key={key} href={`#/${key}`} style={{ padding: '8px 11px', borderRadius: 9, background: route === key ? '#fff' : 'transparent', color: route === key ? '#4338ca' : '#fff', fontWeight: route === key ? 700 : 500, fontSize: 13 }}>
                {label}
              </a>
            ))}
          </nav>
          <button type="button" onClick={() => setShowLogin(true)} style={{ background: '#ffffff22', color: '#fff', border: '1px solid #ffffff44', borderRadius: 9, padding: '8px 13px', fontWeight: 600, cursor: 'pointer' }}>
            🔑 Login Admin
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1500, margin: '0 auto', padding: '24px 20px' }}>
        {route === 'public_dashboard' && (
          <>
            <div className="ph">
              <h1>Dashboard Human Capital</h1>
              <p>Ringkasan informasi Human Capital yang tersedia untuk pengunjung.</p>
            </div>
            {loading && !dashboard ? <p className="empty">Memuat dashboard…</p> : null}
            {dashboard && (
              <>
                <div className="kpis">
                  <div className="kpi"><small>Karyawan aktif</small><b>{number(dashboard.employees?.active)}</b><span>Seluruh perusahaan</span></div>
                  <div className="kpi k1"><small>Lowongan aktif</small><b>{number(dashboard.recruitment?.activeVacancies)}</b><span>Open dan On Progress</span></div>
                  <div className="kpi k3"><small>Kehadiran</small><b>{number(dashboard.attendance?.rate)}%</b><span>Persentase agregat</span></div>
                  <div className="kpi k2"><small>SPD berjalan</small><b>{number(dashboard.operations?.activeTrips)}</b><span>Perjalanan dinas aktif</span></div>
                  <div className="kpi k4"><small>Pelamar</small><b>{number(dashboard.recruitment?.applicants)}</b><span>Total pelamar lowongan</span></div>
                  <div className="kpi k5"><small>Memo publik</small><b>{number(dashboard.operations?.publishedMemos)}</b><span>Memo terbit untuk karyawan</span></div>
                </div>
                <div className="g">
                  <BarList items={dashboard.employees?.byDepartment || []} />
                  <div className="card">
                    <div className="ch"><h3>Headcount Karyawan Aktif per Perusahaan</h3></div>
                    {(dashboard.employees?.byCompany || []).length
                      ? dashboard.employees.byCompany.map((item) => (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 4px', borderBottom: '1px solid var(--l)' }}>
                          <span>{item.name}</span><strong>{number(item.total)} karyawan</strong>
                        </div>
                      ))
                      : <p className="empty">Belum ada data perusahaan.</p>}
                    <p style={{ color: 'var(--m)', fontSize: 12, marginTop: 16 }}>Angka ditampilkan dalam bentuk ringkasan agregat, bukan data pribadi karyawan.</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {route === 'public_employees' && (
          <>
            <div className="ph">
              <h1>Direktori Karyawan</h1>
              <p>Informasi yang ditampilkan kepada pengunjung hanya NIK, Nama, dan Departemen.</p>
            </div>
            <div className="card">
              <div className="ch">
                <h3>Daftar Karyawan Aktif</h3>
                <input className="q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari karyawan…" />
              </div>
              {employees === null && loading ? <p className="empty">Memuat direktori…</p> : (
                <div className="tw">
                  <table>
                    <thead><tr><th>NIK</th><th>Nama</th><th>Departemen</th></tr></thead>
                    <tbody>
                      {visibleEmployees.map((person) => <tr key={`${person.nik}-${person.nama}`}><td>{person.nik || '—'}</td><td>{person.nama || '—'}</td><td>{person.departemen || '—'}</td></tr>)}
                      {!visibleEmployees.length && <tr><td colSpan="3" className="empty">Tidak ada data yang cocok.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {route === 'public_memos' && (
          <>
            <div className="ph">
              <h1>Memo untuk Seluruh Karyawan</h1>
              <p>Hanya memo yang telah diterbitkan dan secara eksplisit ditandai untuk seluruh karyawan.</p>
            </div>
            {memos === null && loading ? <p className="empty">Memuat memo…</p> : (memos || []).length ? (
              (memos || []).map((memo) => (
                <article className="card" key={memo.id}>
                  <div className="ch"><h3>{memo.perihal || 'Memo'}</h3><span className="bd ok">Terbit</span></div>
                  <p style={{ color: 'var(--m)', fontSize: 12 }}>{memo.no_memo || 'Tanpa nomor'} · {date(memo.tanggal)} · Dari: {memo.dari || '—'}</p>
                  {memo.keterangan && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{memo.keterangan}</p>}
                </article>
              ))
            ) : <div className="card"><p className="empty">Belum ada memo yang dipublikasikan.</p></div>}
          </>
        )}

        {error && <div className="card"><h3>Gagal memuat data</h3><p>{error}</p></div>}
      </main>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoggedIn={(name) => { setShowLogin(false); onAdminLogin(name); }} />}
    </>
  );
}
