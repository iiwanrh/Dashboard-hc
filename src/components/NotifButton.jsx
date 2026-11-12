import { useState, useRef, useEffect } from 'react';
import { notifList } from '../core.js';

// ---------- panel notifikasi (dropdown React asli, bukan CSS hover) ----------
export default function NotifButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const items = notifList();

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => setOpen(false);
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
        title="Notifikasi"
      >
        🔔
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-indigo-900">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 sm:mt-2 w-[min(90vw,330px)] max-h-[70vh] overflow-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50">
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-sm text-slate-700 dark:text-slate-100 rounded-t-2xl">
            <span>Notifikasi</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup notifikasi" className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs">✕</button>
          </div>
          {items.length ? items.map((x, i) => (
            <a key={i} href={x.href} onClick={() => setOpen(false)} className="flex gap-2 items-start px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 text-[12.5px] leading-snug hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className={'shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ' + (x.level === 'er' ? 'bg-red-100 text-red-700' : x.level === 'wa' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>
                {x.level === 'er' ? '!' : x.level === 'wa' ? '~' : 'i'}
              </span>
              <span className="text-slate-600 dark:text-slate-200">{x.text}</span>
            </a>
          )) : <p className="text-center text-slate-400 py-6 text-sm">Tidak ada notifikasi 🎉</p>}
        </div>
      )}
    </div>
  );
}
