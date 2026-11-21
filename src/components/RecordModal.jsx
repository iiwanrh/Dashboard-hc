import { useState } from 'react';
import { T, DB } from '../core.js';
import { api } from '../api.js';

// ---------- modal tambah / ubah data (form React asli, controlled input) ----------
export default function RecordModal({ table, id, def, onClose, onSaved }) {
  const fields = T[table];
  const base = id ? (DB[table].find((x) => x.id == id) || {}) : (def || {});
  const [values, setValues] = useState(() => {
    const v = {};
    fields.forEach((f) => { v[f.k] = base[f.k] ?? ''; });
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const r = await api(table, 'POST', values, id);
      await onSaved();
      if (r && r.pending) alert(`Pengajuan ${id ? 'ubah' : 'tambah'} data berhasil dikirim, menunggu persetujuan Super Admin.`);
    } catch (x) {
      setErr(x.message);
      setSaving(false);
    }
  }

  function Field(f) {
    const v = values[f.k];
    const cls = 'w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400';
    if ('sbk'.includes(f.ty)) {
      const opts = f.ty === 'k' ? DB.karyawan.map((k) => [k.nik, k.nik + ' — ' + k.nama]) : f.o.map((x) => [x, x]);
      return (
        <select value={v} onChange={(e) => set(f.k, e.target.value)} className={cls}>
          <option value="">—</option>
          {opts.map(([a, b]) => <option key={a} value={a}>{b}</option>)}
        </select>
      );
    }
    const type = { d: 'date', m: 'time', n: 'number' }[f.ty] || 'text';
    return <input type={type} step={f.ty === 'n' ? 'any' : undefined} value={v} onChange={(e) => set(f.k, e.target.value)} className={cls} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">{id ? 'Ubah' : 'Tambah'} data</h3>
        {err && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{err}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <label key={f.k} className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300">
              {f.l}
              {Field(f)}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:border-indigo-400">Batal</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
