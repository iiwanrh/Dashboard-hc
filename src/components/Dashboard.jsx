import { useState, useEffect, useRef, useCallback } from 'react';
import {
  $$, esc, iso, S, P, setDB, setSEL, setADMSORT, setX, setAdmin,
  resetCharts, runChartQueue, exportTable, downloadTemplate,
  importKaryawan, importSummary,
} from '../core.js';
import { api, logout as apiLogout } from '../api.js';
import Header from './Header.jsx';
import RecordModal from './RecordModal.jsx';
import LoginModal from './LoginModal.jsx';

// ---------- aplikasi utama: dashboard tampil untuk SEMUA ORANG (mode pengunjung,
// read-only). Login admin (lewat tombol di header) membuka mode edit/hapus. ----------
export default function Dashboard({ isAdmin: initialAdmin, userName: initialUserName, onLoggedIn, onLoggedOut }) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isAdmin, setIsAdmin] = useState(!!initialAdmin);
  const [userName, setUserName] = useState(initialUserName || '');
  const [showLogin, setShowLogin] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  const [route, setRoute] = useState(() => (P[location.hash.slice(2)] ? location.hash.slice(2) : 'dashboard'));
  const [selState, setSelState] = useState(() => localStorage.getItem('hc_sel') || iso(new Date()));
  const [admSort, setAdmSortState] = useState('nama');
  const [theme, setTheme] = useState(() => localStorage.getItem('hc_theme') || 'light');
  const [modal, setModal] = useState(null); // {table,id,def} | null
  const [busy, setBusy] = useState('');
  const mainRef = useRef(null);
  const [html, setHtml] = useState('');

  const reload = useCallback(async () => {
    const data = await api('all');
    setDB(data);
    setDbVersion((v) => v + 1);
  }, []);

  // muat seluruh data dashboard dari server saat komponen pertama kali tampil.
  // Endpoint ini publik (bisa dibaca tanpa login) supaya pengunjung tetap bisa
  // melihat dashboard; hanya aksi tambah/ubah/hapus yang mewajibkan login.
  useEffect(() => {
    (async () => {
      try {
        const data = await api('all');
        setDB(data);
        setLoaded(true);
      } catch (e) {
        setLoadError(e.message || 'Gagal memuat data');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hash routing
  useEffect(() => {
    const onHash = () => {
      const r = location.hash.slice(2);
      setRoute(P[r] ? r : 'dashboard');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // tema: harus jalan SEBELUM efek pembuatan halaman, supaya warna grafik ikut tema terbaru
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('hc_theme', theme);
  }, [theme]);

  // bangun ulang halaman (string HTML dari fungsi P[...]) setiap data/rute/tanggal/urutan/tema/status-admin berubah
  useEffect(() => {
    if (!loaded) return;
    setSEL(selState);
    setADMSORT(admSort);
    setAdmin(isAdmin); // kontrol tombol Tambah/Ubah/Hapus/Impor di tbl()/admAll()
    resetCharts();
    setX(S());
    setHtml((P[route] || P.dashboard)());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, route, dbVersion, selState, admSort, theme, isAdmin]);

  // setelah HTML halaman benar-benar terpasang di DOM, baru buat grafik Chart.js-nya
  useEffect(() => { runChartQueue(); }, [html]);

  function handleLoggedIn(name) {
    setIsAdmin(true);
    setUserName(name || '');
    setShowLogin(false);
    onLoggedIn && onLoggedIn(name);
  }

  async function doLogout() {
    if (!confirm('Keluar dari mode admin?')) return;
    await apiLogout();
    setIsAdmin(false);
    setUserName('');
    onLoggedOut && onLoggedOut();
  }

  function handleSelChange(v) { localStorage.setItem('hc_sel', v); setSelState(v); }

  async function onMainClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const { a, t, id, def } = b.dataset;
    // Tombol admin (tambah/ubah/hapus/template) seharusnya sudah disembunyikan
    // di mode pengunjung, tapi tetap dijaga di sini sebagai lapisan kedua.
    if ((a === 'add' || a === 'edit' || a === 'del' || a === 'tpl') && !isAdmin) return;
    if (a === 'add') setModal({ table: t, id: null, def: JSON.parse(def || '{}') });
    if (a === 'edit') setModal({ table: t, id });
    if (a === 'del' && confirm('Hapus data ini?')) {
      try {
        await api(t, 'DELETE', null, id);
        await reload();
      } catch (x) {
        alert(x.message);
      }
    }
    if (a === 'tpl') downloadTemplate(t);
    if (a === 'export') exportTable(b.closest('.card'), (t || 'data') + '_' + selState);
  }

  function onMainInput(e) {
    if (e.target.matches('.q')) {
      const v = e.target.value.toLowerCase();
      $$('tbody tr', e.target.closest('.card')).forEach((tr) => { tr.hidden = !tr.textContent.toLowerCase().includes(v); });
    }
  }

  async function onMainChange(e) {
    if (e.target.id === 'admSortSel') {
      setAdmSortState(e.target.value);
      return;
    }
    if (e.target.id === 'impFile' || e.target.id === 'impKontrak') {
      if (!isAdmin) return;
      const f = e.target.files[0], mode = e.target.id === 'impKontrak' ? 'kontrak' : 'karyawan';
      e.target.value = '';
      if (!f) return;
      setBusy('Mengimpor data…');
      let res = null;
      try {
        res = await importKaryawan(f, mode);
        if (res) await reload(); // data langsung dimuat ulang dari server -> tabel & grafik ikut berubah
      } catch (x) {
        alert('Impor gagal: ' + x.message);
      }
      setBusy('');
      if (res) {
        await new Promise((r) => setTimeout(r, 80));
        alert(importSummary(res));
      }
    }
  }

  // <select>/<input type=file> di dalam HTML hasil dangerouslySetInnerHTML tidak dikenali onChange milik React
  // (React hanya memeriksa elemen yang ia render sendiri), jadi event 'change' dipasang langsung di elemen <main>.
  const changeRef = useRef(onMainChange);
  changeRef.current = onMainChange;
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const h = (e) => changeRef.current(e);
    el.addEventListener('change', h);
    return () => el.removeEventListener('change', h);
  }, []);

  let mainHtml;
  if (loadError) {
    mainHtml = `<div class="card"><h3>Gagal memuat data</h3><p>${esc(loadError)}</p><p>Pastikan variabel lingkungan <b>DATABASE_URL</b> sudah diatur dengan benar dan skema database (schema.sql) sudah dijalankan.</p></div>`;
  } else if (!loaded) {
    mainHtml = '<p class="empty">Memuat data…</p>';
  } else {
    mainHtml = html;
  }

  return (
    <>
      <Header
        route={route}
        isAdmin={isAdmin}
        userName={userName}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onLoginClick={() => setShowLogin(true)}
        onLogout={doLogout}
        sel={selState}
        onSelChange={handleSelChange}
      />
      <main ref={mainRef} className="max-w-[1600px] mx-auto p-4 sm:p-6" onClick={onMainClick} onInput={onMainInput} dangerouslySetInnerHTML={{ __html: mainHtml }} />
      {busy && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl px-6 py-4 shadow-2xl text-sm font-medium">{busy}</div>
        </div>
      )}
      {isAdmin && modal && (
        <RecordModal table={modal.table} id={modal.id} def={modal.def} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await reload(); }} />
      )}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLoggedIn={handleLoggedIn} />
      )}
    </>
  );
}
