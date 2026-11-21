import { useState, useEffect, useRef, useCallback } from 'react';
import {
  $$, esc, iso, S, P, DB, setDB, setSEL, setADMSORT, setX, setRole as setCoreRole,
  resetCharts, runChartQueue, exportTable, downloadTemplate,
  importKaryawan, importSummary,
} from '../core.js';
import { api, approvalAction, logout as apiLogout } from '../api.js';
import Header from './Header.jsx';
import RecordModal from './RecordModal.jsx';
import LoginModal from './LoginModal.jsx';
import ConfirmModal from './ConfirmModal.jsx';

// ---------- aplikasi utama: dashboard tampil untuk SEMUA ORANG (mode pengunjung,
// read-only). Login (lewat tombol di header) membuka mode admin (ajukan
// tambah/ubah/hapus) atau mode Super Admin (hanya dashboard + menyetujui pengajuan). ----------
export default function Dashboard({ role: initialRole, userName: initialUserName, onLoggedIn, onLoggedOut }) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  // role: 'visitor' | 'admin' | 'superadmin'
  const [role, setRole] = useState(initialRole || 'visitor');
  const isAdmin = role !== 'visitor'; // tampilan detail (login) — admin ATAU superadmin
  const canWrite = role === 'admin'; // hanya role admin boleh mengajukan tambah/ubah/hapus
  const [userName, setUserName] = useState(initialUserName || '');
  const [showLogin, setShowLogin] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  // Halaman "Operasional HC" dan "Operasional Dinas dan Tugas" hanya untuk role admin.
  // Halaman "Approval" hanya untuk Super Admin, dan Super Admin HANYA boleh berada di
  // Dashboard atau Approval (sesuai permintaan: "hanya mempunyai akses ke dashboard").
  const ADMIN_ONLY_ROUTES = ['hc', 'dinas'];
  const SUPERADMIN_ONLY_ROUTES = ['approvals'];
  const routeFromHash = (currentRole) => {
    const r = location.hash.slice(2);
    if (!P[r]) return 'dashboard';
    if (currentRole === 'superadmin') return (r === 'dashboard' || SUPERADMIN_ONLY_ROUTES.includes(r)) ? r : 'dashboard';
    if (SUPERADMIN_ONLY_ROUTES.includes(r)) return 'dashboard';
    if (ADMIN_ONLY_ROUTES.includes(r) && currentRole !== 'admin') return 'dashboard';
    return r;
  };
  const [route, setRoute] = useState(() => routeFromHash(initialRole || 'visitor'));
  const [selState, setSelState] = useState(() => localStorage.getItem('hc_sel') || iso(new Date()));
  const [admSort, setAdmSortState] = useState('nama');
  const [theme, setTheme] = useState(() => localStorage.getItem('hc_theme') || 'light');
  const [modal, setModal] = useState(null); // {table,id,def} | null
  // Modal konfirmasi kustom (pengganti confirm() bawaan browser). askConfirm() dipakai
  // seperti confirm() biasa tapi mengembalikan Promise<boolean> dan tampil lebih menarik.
  const [confirmState, setConfirmState] = useState(null);
  const askConfirm = useCallback((message, opts = {}) => new Promise((resolve) => {
    setConfirmState({ message, ...opts, resolve });
  }), []);
  const closeConfirm = (result) => {
    confirmState?.resolve?.(result);
    setConfirmState(null);
  };
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
      setRoute(routeFromHash(role));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // kalau role berubah (mis. logout saat sedang membuka halaman khusus admin/superadmin),
  // pastikan tetap berada di halaman yang diizinkan untuk role saat ini.
  useEffect(() => {
    const allowed = routeFromHash(role);
    if (allowed !== route) {
      location.hash = '#/' + allowed;
      setRoute(allowed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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
    setCoreRole(role); // kontrol tampilan detail (ADMIN) & tombol Tambah/Ubah/Hapus/Impor (CANWRITE) di tbl()/admAll()
    resetCharts();
    setX(S());
    setHtml((P[route] || P.dashboard)());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, route, dbVersion, selState, admSort, theme, role]);

  // setelah HTML halaman benar-benar terpasang di DOM, baru buat grafik Chart.js-nya
  useEffect(() => { runChartQueue(); }, [html]);

  function handleLoggedIn(name, r) {
    setRole(r || 'admin');
    setUserName(name || '');
    setShowLogin(false);
    onLoggedIn && onLoggedIn(name, r);
  }

  async function doLogout() {
    const ok = await askConfirm('Anda akan keluar dari mode login dan kembali ke tampilan pengunjung.', { title: 'Keluar dari aplikasi?', variant: 'warn', confirmLabel: '🚪 Ya, keluar' });
    if (!ok) return;
    await apiLogout();
    setRole('visitor');
    setUserName('');
    onLoggedOut && onLoggedOut();
  }

  function handleSelChange(v) { localStorage.setItem('hc_sel', v); setSelState(v); }

  async function onMainClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const { a, t, id, def } = b.dataset;
    // Tombol tambah/ubah/hapus/template seharusnya sudah disembunyikan di mode
    // pengunjung & Super Admin, tapi tetap dijaga di sini sebagai lapisan kedua.
    if ((a === 'add' || a === 'edit' || a === 'del' || a === 'tpl') && !canWrite) return;
    if (a === 'add') setModal({ table: t, id: null, def: JSON.parse(def || '{}') });
    if (a === 'edit') setModal({ table: t, id });
    if (a === 'del' && await askConfirm('Perubahan baru akan benar-benar berlaku setelah disetujui Super Admin.', { title: 'Ajukan penghapusan data ini?', variant: 'danger', confirmLabel: '🗑️ Ajukan Hapus' })) {
      try {
        const r = await api(t, 'DELETE', null, id);
        await reload();
        if (r && r.pending) alert('Pengajuan hapus data berhasil dikirim, menunggu persetujuan Super Admin.');
      } catch (x) {
        alert(x.message);
      }
    }
    if (a === 'tpl') downloadTemplate(t);
    if (a === 'export') exportTable(b.closest('.card'), (t || 'data') + '_' + selState);
    // ---- aksi khusus halaman Approval (Super Admin) ----
    if ((a === 'approve' || a === 'reject') && role === 'superadmin') {
      if (a === 'reject' && !(await askConfirm('Data tidak akan diubah sama sekali.', { title: 'Tolak pengajuan ini?', variant: 'reject', confirmLabel: '✕ Ya, tolak' }))) return;
      if (a === 'approve' && !(await askConfirm('Perubahan akan langsung diterapkan ke database.', { title: 'Setujui pengajuan ini?', variant: 'approve', confirmLabel: '✅ Ya, setujui' }))) return;
      const note = a === 'reject' ? (prompt('Alasan penolakan (opsional):') || '') : '';
      try {
        await approvalAction(id, a, note);
        await reload();
      } catch (x) {
        alert(x.message);
      }
    }
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
      if (!canWrite) return;
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

  const pendingCount = (DB.approvals || []).filter((r) => r.status === 'pending').length;

  return (
    <>
      <Header
        route={route}
        role={role}
        isAdmin={isAdmin}
        pendingCount={pendingCount}
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
      {canWrite && modal && (
        <RecordModal table={modal.table} id={modal.id} def={modal.def} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await reload(); }} />
      )}
      <ConfirmModal state={confirmState} onConfirm={() => closeConfirm(true)} onCancel={() => closeConfirm(false)} />
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLoggedIn={handleLoggedIn} />
      )}
    </>
  );
}
