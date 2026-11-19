import { useState, useRef, useEffect } from 'react';
import NotifButton from './NotifButton.jsx';

// ---------- header + navigasi ----------
const NAV_MAIN = [{ r: 'dashboard', label: '📊 Dashboard' }, { r: 'recruitment', label: '🧲 Recruitment' }];
const NAV_OPS = [{ r: 'hc', label: 'Operasional HC' }, { r: 'dinas', label: 'Operasional Dinas dan Tugas' }];
const NAV_ADM = [{ r: 'administrasi_amsa', label: 'Karyawan PT Amsa' }, { r: 'administrasi_jala', label: 'Karyawan PT Jala' }, { r: 'memo', label: 'Administrasi Memo' }];

export default function Header({ route, isAdmin, userName, theme, onToggleTheme, onLoginClick, onLogout, sel, onSelChange }) {
  const [navOpen, setNavOpen] = useState(false);
  const [ddOpen, setDdOpen] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setDdOpen(null); };
    const onKey = (e) => { if (e.key === 'Escape') setDdOpen(null); };
    const onResize = () => { setDdOpen(null); if (window.innerWidth >= 1024) setNavOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => { setDdOpen(null); setNavOpen(false); }, [route]);

  const linkCls = (r) => 'block lg:inline-block px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ' +
    (route === r ? 'bg-white text-indigo-700 font-semibold' : 'text-white/85 hover:bg-white/15 hover:text-white');

  function Dropdown({ id, label, items }) {
    const active = items.some((i) => i.r === route);
    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setDdOpen((o) => (o === id ? null : id)); }}
          className={'w-full lg:w-auto flex items-center justify-between lg:justify-start gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ' +
            (active ? 'bg-white text-indigo-700 font-semibold' : 'text-white/85 hover:bg-white/15 hover:text-white')}
        >
          <span>{label}</span>
          <span className="text-xs">▾</span>
        </button>
        {ddOpen === id && (
          <div className="lg:absolute lg:top-full lg:left-0 lg:mt-1 lg:w-[230px] lg:bg-white dark:lg:bg-slate-800 lg:rounded-xl lg:shadow-xl lg:p-1.5 mt-1 ml-3 lg:ml-0 border-l-2 lg:border-0 border-white/20 pl-2 lg:pl-0">
            {items.map((it) => (
              <a key={it.r} href={'#/' + it.r} onClick={() => setDdOpen(null)} className={'block px-3 py-2 rounded-lg text-sm ' + (route === it.r ? 'bg-indigo-50 text-indigo-700' : 'text-white/90 lg:text-slate-700 hover:bg-white/10 lg:hover:bg-indigo-50')}>
                {it.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  const DateField = ({ className }) => (
    <label className={'flex items-center gap-2 text-xs ' + className}>
      Tgl. terpilih
      <input type="date" value={sel} onChange={(e) => e.target.value && onSelChange(e.target.value)} className="rounded-lg px-2 py-1 text-slate-800" />
    </label>
  );

  // Notifikasi, mode gelap/terang: selalu tampil. Sisi admin: kalau sudah login
  // tampilkan nama + tombol Keluar; kalau belum (mode pengunjung/read-only)
  // tampilkan tombol "Login Admin" saja.
  // Layar lebar (>=1024px) tampil di bar; layar kecil dipindah ke dalam panel menu burger.
  const Actions = ({ className }) => (
    <div className={'items-center gap-2 ' + className}>
      {isAdmin && <NotifButton />}
      <button type="button" onClick={onToggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition" title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {isAdmin ? (
        <>
          <span className="max-w-[110px] truncate text-xs opacity-90">{userName || '—'}</span>
          <button type="button" onClick={onLogout} title="Keluar dari aplikasi" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 active:scale-95 transition rounded-lg px-3 py-2 text-sm font-semibold shadow-sm">
            🚪 <span>Keluar</span>
          </button>
        </>
      ) : (
        <button type="button" onClick={onLoginClick} title="Login sebagai admin untuk mengubah data" className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 transition rounded-lg px-3 py-2 text-sm font-semibold shadow-sm">
          🔑 <span>Login Admin</span>
        </button>
      )}
    </div>
  );

  return (
    <header ref={barRef} className="sticky top-0 z-30 bg-gradient-to-r from-indigo-900 to-indigo-600 text-white shadow-lg">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5">
        <a href="#/dashboard" className="flex items-center gap-2 font-bold text-base shrink-0">
          <span className="bg-white text-indigo-700 rounded-lg px-2 py-1 text-sm">HC</span>
          <span className="hidden xs:inline">Human Capital</span>
        </a>
        <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
          {NAV_MAIN.map((n) => <a key={n.r} href={'#/' + n.r} className={linkCls(n.r)}>{n.label}</a>)}
          {isAdmin && <Dropdown id="ops" label="⚙️ Operasional" items={NAV_OPS} />}
          <Dropdown id="adm" label="🗂️ Administrasi" items={NAV_ADM} />
          <a href="#/er" className={linkCls('er')}>🤝 Employee Relations</a>
        </nav>
        <DateField className="hidden lg:flex shrink-0 ml-2" />
        <Actions className="hidden lg:flex shrink-0 ml-2" />
        <button type="button" onClick={() => setNavOpen((o) => !o)} aria-label="Menu" aria-expanded={navOpen} className="lg:hidden ml-auto shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/15 text-xl">
          {navOpen ? '✕' : '☰'}
        </button>
      </div>
      {navOpen && (
        <nav className="lg:hidden px-4 pb-3 flex flex-col gap-1 bg-black/10">
          {NAV_MAIN.map((n) => <a key={n.r} href={'#/' + n.r} onClick={() => setNavOpen(false)} className={linkCls(n.r)}>{n.label}</a>)}
          {isAdmin && <Dropdown id="ops-m" label="⚙️ Operasional" items={NAV_OPS} />}
          <Dropdown id="adm-m" label="🗂️ Administrasi" items={NAV_ADM} />
          <a href="#/er" onClick={() => setNavOpen(false)} className={linkCls('er')}>🤝 Employee Relations</a>
          <DateField className="mt-2" />
          <Actions className="flex justify-end mt-2 pt-2 border-t border-white/20" />
        </nav>
      )}
    </header>
  );
}
