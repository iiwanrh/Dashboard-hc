import { useEffect, useRef } from 'react';

// Pengganti confirm() bawaan browser yang tampilannya kaku & tidak bisa diberi style.
// Dipakai lewat helper askConfirm() di Dashboard.jsx — tinggal render <ConfirmModal/>
// sekali di root dan state-nya diisi oleh askConfirm().
const ICONS = { danger: '🗑️', warn: '⚠️', approve: '✅', reject: '✕', info: 'ℹ️' };

export default function ConfirmModal({ state, onConfirm, onCancel }) {
  const okRef = useRef(null);
  useEffect(() => {
    if (state) okRef.current?.focus();
    const onKey = (e) => {
      if (!state) return;
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, onConfirm, onCancel]);

  if (!state) return null;
  const variant = state.variant || 'warn';
  const danger = variant === 'danger' || variant === 'reject';
  const icon = ICONS[variant] || ICONS.warn;

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-pop" style={{ background: 'var(--bg,#fff)', color: 'inherit', borderRadius: 18, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px -12px rgba(0,0,0,.35)', overflow: 'hidden' }}>
        <div style={{ padding: '26px 24px 18px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            background: danger ? 'linear-gradient(145deg,#fee2e2,#fecaca)' : variant === 'approve' ? 'linear-gradient(145deg,#d1fae5,#a7f3d0)' : 'linear-gradient(145deg,#e0e7ff,#c7d2fe)',
          }}>{icon}</div>
          {state.title && <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>{state.title}</h3>}
          <p style={{ margin: 0, fontSize: 14, color: 'var(--m,#64748b)', lineHeight: 1.5 }}>{state.message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1px solid var(--l,#e2e8f0)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
            {state.cancelLabel || 'Batal'}
          </button>
          <button ref={okRef} type="button" onClick={onConfirm} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', color: '#fff',
            background: danger ? '#ef4444' : variant === 'approve' ? '#10b981' : '#4f46e5',
            boxShadow: `0 8px 18px -6px ${danger ? '#ef444488' : variant === 'approve' ? '#10b98188' : '#4f46e588'}`,
          }}>
            {state.confirmLabel || 'Ya, lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
