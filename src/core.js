// ---------------------------------------------------------------------------
// Logika inti dashboard: definisi tabel/form, rumus (S), grafik (G), halaman (P).
// Ini adalah PORTING LANGSUNG dari assets/app.js versi PHP lama — semua rumus,
// label, dan urutan kolom SENGAJA dipertahankan persis sama supaya angka yang
// tampil tidak berubah. Yang berubah hanya cara modul ini dimuat (ES module,
// bukan skrip global) dan sumber library (npm, bukan file vendor lokal).
// ---------------------------------------------------------------------------
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import { api } from './api.js';

export const $ = (s, e = document) => e.querySelector(s);
export const $$ = (s, e = document) => [...e.querySelectorAll(s)];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const DEPT = ['PPIC', 'Production Assembly', 'General Affairs', 'Finance & Accounting', 'Human Capital', 'Intelegent System Engineering', 'Production Engineering', 'QA & QC', 'Production Fabrication', 'Product Development', 'Design Engineering', 'Procurement', 'Board of Directors (Staff Ahli)', 'Secretary', 'PMO', 'Product Support'];
export const L = { tipe: ['Tetap', 'Kontrak', 'PHL'], ks: ['Aktif', 'Resign'], jk: ['PKWT', 'PKWTT', 'HARIAN'], mp: ['Diajukan', 'Pending', 'Diterima', 'Ditolak'], lw: ['Open', 'On Progress', 'Closed'], ob: ['Terjadwal', 'Berlangsung', 'Selesai'], cuti: ['Tahunan', 'Sakit', 'Melahirkan', 'Besar', 'Lainnya'], sc: ['Diajukan', 'Disetujui', 'Ditolak'], hon: ['Belum diajukan', 'Diajukan', 'Dibayar'], hl: ['Hari Kerja', 'Sabtu', 'Minggu', 'Hari Libur'], memo: ['Draft', 'Terbit', 'Arsip'], kat: ['Ringan', 'Sedang', 'Berat'], sp: ['SP1', 'SP2', 'SP3'] };
// ---------- definisi field form (k=kolom DB, l=label, ty: t teks, n angka, d tanggal, m jam, s pilihan, b pilihan+badge, k pilih karyawan)
const F = (k, l, ty = 't', o) => ({ k, l, ty, o });
export const T = {
    pengaturan: [F('kunci', 'Pengaturan'), F('nilai', 'Nilai')],
    karyawan: [F('nik', 'NIK'), F('nama', 'Nama Lengkap'), F('departemen', 'Departemen', 's', DEPT), F('tipe', 'Tipe', 's', L.tipe), F('tgl_masuk', 'Tanggal Masuk', 'd'), F('tgl_resign', 'Tanggal Resign', 'd'), F('status', 'Status', 'b', L.ks), F('jabatan', 'Jabatan'), F('alasan_resign', 'Alasan Resign'), F('no_kontrak', 'No. Kontrak'), F('jenis_kontrak', 'Jenis Kontrak', 's', L.jk), F('mulai_kontrak', 'Mulai Kontrak', 'd'), F('berakhir', 'Berakhir', 'd')],
    manpower: [F('no_pengajuan', 'No. Pengajuan'), F('tgl_pengajuan', 'Tgl Pengajuan', 'd'), F('departemen', 'Departemen', 's', DEPT), F('posisi', 'Posisi'), F('jumlah', 'Jumlah Orang', 'n'), F('alasan', 'Alasan'), F('pemohon', 'Pemohon'), F('status', 'Status', 'b', L.mp), F('tgl_keputusan', 'Tgl Keputusan', 'd')],
    lowongan: [F('posisi', 'Posisi'), F('departemen', 'Departemen', 's', DEPT), F('tgl_buka', 'Tanggal Buka', 'd'), F('kebutuhan', 'Kebutuhan', 'n'), F('pelamar', 'Jumlah Pelamar', 'n'), F('diterima', 'Diterima', 'n'), F('status', 'Status', 'b', L.lw), F('target_selesai', 'Target Selesai', 'd')],
    funnel: [F('tahap', 'Tahap'), F('jumlah', 'Jumlah', 'n')],
    onboarding: [F('nama', 'Nama Karyawan Baru'), F('posisi', 'Posisi'), F('divisi', 'Divisi', 's', DEPT), F('tgl_onboarding', 'Tgl Onboarding', 'd'), F('tgl_mulai', 'Tgl Mulai Kerja', 'd'), F('pj', 'Penanggung Jawab'), F('status', 'Status', 'b', L.ob), F('keterangan', 'Keterangan')],
    kehadiran: [F('bulan', 'Bulan (isi tanggal 1)', 'd'), F('hari_kerja', 'Hari Kerja', 'n'), F('masuk', 'Karyawan Masuk (orang-hari)', 'n'), F('izin_sakit', 'Izin / Sakit', 'n'), F('cuti', 'Cuti', 'n'), F('dinas', 'Dinas Luar Kota', 'n'), F('keterangan', 'Keterangan')],
    cuti: [F('tgl_pengajuan', 'Tgl Pengajuan', 'd'), F('nik', 'NIK Karyawan', 'k'), F('jenis_cuti', 'Jenis Cuti', 's', L.cuti), F('mulai', 'Mulai', 'd'), F('selesai', 'Selesai', 'd'), F('status', 'Status', 'b', L.sc), F('keterangan', 'Keterangan')],
    spd: [F('no_surat', 'No. Surat'), F('tgl_surat', 'Tanggal Surat', 'd'), F('nik', 'NIK Karyawan', 'k'), F('kota', 'Kota Tujuan'), F('berangkat', 'Berangkat', 'd'), F('kembali', 'Kembali', 'd'), F('keperluan', 'Keperluan')],
    honor: [F('no_spd', 'No. SPD'), F('nominal', 'Nominal Honor', 'n'), F('tgl_pengajuan', 'Tgl Pengajuan', 'd'), F('status', 'Status', 'b', L.hon), F('tgl_dibayar', 'Tgl Dibayar', 'd'), F('keterangan', 'Keterangan')],
    surat_tugas: [F('no_surat', 'No. Surat Tugas'), F('tanggal', 'Tanggal', 'd'), F('nik', 'NIK Karyawan', 'k'), F('tujuan', 'Tujuan Tugas'), F('mulai', 'Mulai', 'd'), F('selesai', 'Selesai', 'd')],
    lembur: [F('no_surat', 'No. Surat Lembur'), F('tanggal', 'Tanggal Lembur', 'd'), F('nik', 'NIK Karyawan', 'k'), F('jam_mulai', 'Jam Mulai', 'm'), F('jam_selesai', 'Jam Selesai', 'm'), F('hari_lembur', 'Hari Lembur', 's', L.hl)],
    lembur_status: [F('tanggal', 'Tanggal Lembur', 'd'), F('status', 'Status Penggajian', 'b', L.hon), F('tgl_pengajuan', 'Tgl Pengajuan', 'd')],
    memo: [F('no_memo', 'No. Memo'), F('tanggal', 'Tanggal', 'd'), F('perihal', 'Perihal'), F('tujuan', 'Ditujukan Kepada'), F('dari', 'Dari'), F('status', 'Status', 'b', L.memo), F('keterangan', 'Keterangan')],
    pelanggaran: [F('no_plg', 'No.'), F('tanggal', 'Tanggal', 'd'), F('nik', 'NIK Karyawan', 'k'), F('jenis', 'Jenis Pelanggaran'), F('kategori', 'Kategori', 'b', L.kat), F('uraian', 'Uraian / Bukti'), F('tindak_lanjut', 'Tindak Lanjut')],
    sp: [F('no_sp', 'No. SP'), F('nik', 'NIK Karyawan', 'k'), F('jenis_sp', 'Jenis SP', 's', L.sp), F('tgl_terbit', 'Tanggal Terbit', 'd'), F('masa_berlaku', 'Masa Berlaku (bulan)', 'n'), F('no_pelanggaran', 'No. Pelanggaran')]
};
// ---------- helper (tema gelap/terang kini dikelola React, lihat App.jsx)
export let DB = {}, X = {}, SEL = '', Q = [], CH = [], ADMSORT = 'nama', ADMIN = false;
export function setDB(v) { DB = v; }
export function setSEL(v) { SEL = v; }
export function setADMSORT(v) { ADMSORT = v; }
export function setX(v) { X = v; }
// Mode admin (sudah login) vs mode pengunjung (hanya baca). Dipakai tbl()/admAll()
// untuk menyembunyikan tombol Tambah/Ubah/Hapus/Impor saat belum login.
export function setAdmin(v) { ADMIN = v; }
export function resetCharts() { CH.forEach(c => c.destroy()); CH = []; Q = []; }
export function runChartQueue() { Q.forEach(f => f()); }
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const D = s => new Date(s.slice(0, 10) + 'T00:00:00'), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const fd = s => s ? D(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '', hm = s => s ? s.slice(0, 5) : '';
export const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID'), nf = n => Number(n || 0).toLocaleString('id-ID');
export const dd = (a, b) => Math.round((D(a) - D(b)) / 864e5), dur = (a, b) => a && b ? dd(b, a) + 1 : '', addM = (s, n) => { const d = D(s); return iso(new Date(d.getFullYear(), d.getMonth() + n, d.getDate())); };
export const netdays = (a, b) => { let n = 0; for (let d = D(a); d <= D(b); d.setDate(d.getDate() + 1))
    if (d.getDay() % 6)
        n++; return n; };
export const sum = (a, f) => a.reduce((s, r) => s + (+(typeof f == 'function' ? f(r) : r[f]) || 0), 0), cnt = (a, f) => a.filter(f).length;
const BC = { Aktif: 'ok', Terbit: 'ok', Diterima: 'ok', Dibayar: 'ok', Selesai: 'ok', Disetujui: 'ok', Berlaku: 'ok', Open: 'ok', Tetap: 'ok', Resign: 'er', Ditolak: 'er', Berakhir: 'er', Berat: 'er', Kadaluarsa: 'er', Closed: 'na', Arsip: 'na', Diajukan: 'wa', Pending: 'wa', Draft: 'wa', 'On Progress': 'wa', 'Segera Berakhir': 'wa', Terjadwal: 'wa', Berlangsung: 'wa', Sedang: 'wa', 'Belum diajukan': 'wa', Ringan: 'in' };
export const bd = v => v ? `<span class="bd ${BC[v] || 'na'}">${esc(v)}</span>` : '';
export const nm = nik => (DB.karyawan.find(k => k.nik == nik) || {}).nama || '', tp = nik => (DB.karyawan.find(k => k.nik == nik) || {}).tipe || '';
export const jam = r => { if (!r.jam_mulai || !r.jam_selesai)
    return 0; const [a, b] = r.jam_mulai.split(':'), [c, d] = r.jam_selesai.split(':'); let x = (c * 60 + +d) - (a * 60 + +b); if (x < 0)
    x += 1440; return Math.round(x / 60 * 100) / 100; };
export const lst = t => (DB.lembur_status.find(r => r.tanggal == t) || {}).status || 'Belum diajukan';
export const kst = k => k.jenis_kontrak == 'PKWTT' ? 'Tetap' : !k.berakhir ? 'Aktif' : k.berakhir < SEL ? 'Berakhir' : dd(k.berakhir, SEL) <= 30 ? 'Segera Berakhir' : 'Aktif';
export const spx = r => { if (!r.tgl_terbit || !r.masa_berlaku)
    return { b: '', s: '', st: '' }; const b = addM(r.tgl_terbit, +r.masa_berlaku), s = dd(b, SEL); return { b, s, st: s < 0 ? 'Kadaluarsa' : 'Berlaku' }; };
export const bl = b => MON[+b.slice(5, 7) - 1] + ' ' + b.slice(0, 4), resM = b => cnt(DB.karyawan, k => k.tgl_resign && k.tgl_resign.slice(0, 7) == b.slice(0, 7));
export const pct = r => r.hari_kerja ? Math.round(r.masuk / (X.basis * r.hari_kerja) * 1000) / 10 : 0;
// ---------- perhitungan angka (setara rumus Excel)
export function S() {
    const K = DB.karyawan, ak = K.filter(k => k.status == 'Aktif'), y = SEL.slice(0, 4), ym = SEL.slice(0, 7), yr = d => d && d.slice(0, 4) == y, mo = d => d && d.slice(0, 7) == ym, s = { y };
    s.aktif = ak.length;
    L.tipe.forEach(t => s[t] = cnt(ak, k => k.tipe == t));
    s.resign = cnt(K, k => k.status == 'Resign');
    s.segera = cnt(K, k => k.tipe == 'Kontrak' && kst(k) == 'Segera Berakhir');
    s.mpOk = cnt(DB.manpower, r => r.status == 'Diterima');
    s.lw = cnt(DB.lowongan, r => r.status == 'Open' || r.status == 'On Progress');
    s.pel = sum(DB.lowongan, 'pelamar');
    s.proses = sum(DB.funnel.filter(r => r.tahap != 'Diterima'), 'jumlah');
    s.fnOk = sum(DB.funnel.filter(r => r.tahap == 'Diterima'), 'jumlah');
    s.onb = cnt(DB.onboarding, r => yr(r.tgl_onboarding));
    const H = DB.kehadiran;
    s.basis = +(DB.pengaturan.find(r => r.kunci == 'basis_manual') || {}).nilai || s.aktif;
    s.hari = sum(H, 'hari_kerja');
    s.masuk = sum(H, 'masuk');
    s.izin = sum(H, 'izin_sakit');
    s.cuti = sum(H, 'cuti');
    s.dinas = sum(H, 'dinas');
    s.resignP = sum(H, r => resM(r.bulan));
    s.hadir = s.hari ? s.masuk / (s.basis * s.hari) : 0;
    s.spdJalan = cnt(DB.spd, r => r.berangkat <= SEL && r.kembali >= SEL);
    s.spdTahun = cnt(DB.spd, r => yr(r.tgl_surat) && r.tgl_surat <= SEL);
    s.spdBulan = cnt(DB.spd, r => mo(r.tgl_surat) && r.tgl_surat <= SEL);
    L.hon.forEach((h, i) => s['h' + i] = sum(DB.honor.filter(r => r.status == h), 'nominal'));
    s.sl = DB.lembur.length;
    s.jam = Math.round(sum(DB.lembur, jam) * 100) / 100;
    s.jamB = Math.round(sum(DB.lembur.filter(r => lst(r.tanggal) == 'Belum diajukan'), jam) * 100) / 100;
    s.jamS = Math.round((s.jam - s.jamB) * 100) / 100;
    s.st = DB.surat_tugas.length;
    s.stAktif = cnt(DB.surat_tugas, r => r.mulai <= SEL && r.selesai >= SEL);
    s.memo = DB.memo.length;
    s.terbit = cnt(DB.memo, r => r.status == 'Terbit');
    s.draft = cnt(DB.memo, r => r.status == 'Draft');
    s.memoB = cnt(DB.memo, r => mo(r.tanggal) && r.tanggal <= SEL);
    s.plgY = cnt(DB.pelanggaran, r => yr(r.tanggal) && r.tanggal <= SEL);
    L.kat.forEach(k => s[k] = cnt(DB.pelanggaran, r => r.kategori == k));
    s.spOk = cnt(DB.sp, r => spx(r).st == 'Berlaku');
    s.spEx = DB.sp.length - s.spOk;
    return s;
}
// ---------- komponen
export const kpi = (l, v, s, c = 0) => `<div class="kpi k${c}"><small>${l}</small><b>${v}</b><span>${s || ''}</span></div>`, kpis = a => `<div class="kpis">${a.join('')}</div>`;
export const head = (t, s) => `<div class="ph"><h1>${t}</h1><p>${s}</p></div>`;
export const sec = (t, r, b) => `<div class="sh"><h2>${t}</h2><a class="btn p" href="#/${r}">Buka halaman ▶</a></div>${b}`;
export const col = (t, k) => T[t].find(f => f.k == k);
export function tbl(t, title, show, o = {}) {
    const ro = o.ro || !ADMIN; // mode pengunjung (belum login) selalu read-only, apapun pengaturan tabelnya
    const cols = show.map(s => typeof s == 'string' ? col(t, s) : s), rows = o.rows || DB[t];
    const cell = (r, c) => {
        const v = c.c ? c.c(r) : r[c.k];
        if (c.raw)
            return v;
        if (v == null || v === '')
            return '';
        return c.bd || c.ty == 'b' ? bd(v) : c.ty == 'd' ? fd(v) : c.ty == 'm' ? hm(v) : c.ty == 'n' ? (c.rp ? rp(v) : nf(v)) : esc(v);
    };
    return `<div class="card"><div class="ch"><h3>${title}</h3><input class="q" placeholder="Cari…">${ro ? '' : (o.extra || '')}<button class="btn" data-a="export" data-t="${t}" title="Export ke Excel">⬇ Excel</button>${ro ? '' : `<button class="btn p" data-a="add" data-t="${t}" data-def='${JSON.stringify(o.def || {})}'>＋ Tambah</button>`}</div><div class="tw"><table><thead><tr>${cols.map(c => `<th>${c.l}</th>`).join('')}${ro ? '' : '<th></th>'}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${cell(r, c)}</td>`).join('')}${ro ? '' : `<td class="ac"><button data-a="edit" data-t="${t}" data-id="${r.id}" title="Ubah">✎</button><button data-a="del" data-t="${t}" data-id="${r.id}" title="Hapus">🗑</button></td>`}</tr>`).join('') || '<tr><td colspan="99" class="empty">Belum ada data</td></tr>'}</tbody></table></div></div>`;
}
const PAL = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
Chart.register(ChartDataLabels);
function themeInk() { const dark = document.documentElement.getAttribute('data-theme') == 'dark'; return { text: dark ? '#cbd5e1' : '#475569', grid: dark ? '#ffffff14' : '#0000000d' }; }
export function chart(title, type, labels, sets, o = {}) {
    const id = 'c' + Q.length, dn = type == 'doughnut', ink = themeInk();
    Q.push(() => CH.push(new Chart($('#' + id), { type, data: { labels, datasets: sets.map((s, i) => ({ backgroundColor: dn ? PAL : (s.color || PAL[i]), hoverBackgroundColor: dn ? PAL : (s.color || PAL[i]), borderRadius: 8, borderSkipped: false, barThickness: o.thin ? 14 : undefined, maxBarThickness: 28, ...s })) },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: o.h ? 'y' : 'x', interaction: { mode: 'nearest', intersect: true },
            plugins: { legend: { display: dn || sets.length > 1, position: 'bottom', labels: { color: ink.text, usePointStyle: true, boxWidth: 8, padding: 14 } },
                tooltip: { backgroundColor: '#1e293bf2', padding: 10, cornerRadius: 10, titleFont: { weight: '600' }, displayColors: true, boxPadding: 4 },
                datalabels: { display: !!o.labels, color: '#fff', font: { weight: '700', size: 11 }, formatter: v => v || '' } },
            scales: dn ? {} : { x: { stacked: !!o.st, grid: { display: false }, ticks: { color: ink.text } }, y: { stacked: !!o.st, beginAtZero: true, grid: { color: ink.grid }, ticks: { color: ink.text } } } } })));
    return `<div class="card"><div class="ch"><h3>${title}</h3></div><div class="cv"><canvas id="${id}"></canvas></div></div>`;
}
export function chartLine(title, labels, data, color, o = {}) {
    const id = 'c' + Q.length, c = color || '#4f46e5', ink = themeInk(), lo = Math.min(...data), hi = Math.max(...data);
    Q.push(() => {
        const ctx = $('#' + id).getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, 260);
        g.addColorStop(0, c + '55');
        g.addColorStop(1, c + '02');
        CH.push(new Chart($('#' + id), { type: 'line', data: { labels, datasets: [{ label: o.unit || title, data, borderColor: c, backgroundColor: g, fill: true, tension: .35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: c, pointBorderColor: '#fff', pointBorderWidth: 1.5, pointHoverRadius: 7 }] },
            options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 18 } },
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293bf2', padding: 10, cornerRadius: 10 },
                    datalabels: { display: !!o.labels, align: 'top', anchor: 'end', offset: 4, color: ink.text, font: { weight: '700', size: 11 }, formatter: v => v } },
                scales: { x: { grid: { display: false }, ticks: { color: ink.text } },
                    y: { beginAtZero: false, suggestedMin: Math.max(0, lo - 2), suggestedMax: hi + 2, grid: { color: ink.grid }, ticks: { color: ink.text, precision: 0 }, title: { display: !!o.yTitle, text: o.yTitle || '', color: ink.text } } } } }));
    });
    return `<div class="card"><div class="ch"><h3>${title}</h3></div>${o.note ? `<p style="margin:-4px 0 10px;font-size:12px;color:var(--m)">${o.note}</p>` : ''}<div class="cv"><canvas id="${id}"></canvas></div></div>`;
}
const cnts = (a, k, v) => v.map(x => cnt(a, r => r[k] == x));
function deptRows() {
    const a = DB.karyawan.filter(k => k.status == 'Aktif'), nmD = k => k.departemen || '(Tanpa departemen)', names = [...new Set(a.map(nmD))];
    names.sort((x, y) => { const i = DEPT.indexOf(x), j = DEPT.indexOf(y); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j) || x.localeCompare(y); });
    return names.map(d => { const r = { d }; L.tipe.forEach(t => r[t] = cnt(a, k => nmD(k) == d && k.tipe == t)); r.tot = cnt(a, k => nmD(k) == d); return r; });
}
function trendRows() {
    const base = D(SEL), K = DB.karyawan, day = x => (x || '').slice(0, 10), hc = end => cnt(K, k => k.tgl_masuk && day(k.tgl_masuk) <= end && (!k.tgl_resign || day(k.tgl_resign) > end));
    return [...Array(12)].map((_, i) => {
        const d = new Date(base.getFullYear(), base.getMonth() - 11 + i, 1), end = i == 11 ? SEL : iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)), prev = iso(new Date(d.getFullYear(), d.getMonth(), 0)), inP = x => x && day(x) > prev && day(x) <= end;
        return { label: MON[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2), awal: hc(prev), masuk: cnt(K, k => k.tgl_masuk && inP(k.tgl_masuk)), resign: cnt(K, k => k.tgl_masuk && inP(k.tgl_resign)), akhir: hc(end) };
    });
}
export const G = {
    head: () => {
        const R = deptRows(), d = R.map(r => r.d), TC = { Tetap: '#10b981', Kontrak: '#4f46e5', PHL: '#f59e0b' };
        return chart('Headcount Aktif per Departemen', 'bar', d, L.tipe.map(t => ({ label: t, color: TC[t], data: R.map(r => r[t]) })), { h: 1, st: 1, labels: 1 });
    },
    headTbl: () => {
        const R = deptRows(), tot = { d: 'TOTAL', Tetap: 0, Kontrak: 0, PHL: 0, tot: 0, all: 1 };
        R.forEach(r => { L.tipe.forEach(t => tot[t] += r[t]); tot.tot += r.tot; });
        const B = (r, v) => r.all ? `<b>${v}</b>` : v;
        return tbl('headcount_departemen', 'Tabel Headcount Aktif per Departemen', [
            { l: 'Departemen', raw: 1, c: r => B(r, esc(r.d)) },
            ...L.tipe.map(t => ({ l: t, raw: 1, c: r => B(r, nf(r[t])) })),
            { l: 'Total', raw: 1, c: r => B(r, nf(r.tot)) },
            { l: '% dari Total', raw: 1, c: r => B(r, tot.tot ? (r.tot / tot.tot * 100).toFixed(1) + '%' : '0%') }
        ], { ro: 1, rows: [...R, tot] });
    },
    headTrend: () => {
        const R = trendRows();
        return chartLine('Tren Headcount Aktif — 12 Bulan Terakhir', R.map(r => r.label), R.map(r => r.akhir), '#4f46e5', { labels: 1, unit: 'Headcount', yTitle: 'Jumlah karyawan aktif', note: 'Jumlah karyawan yang sudah masuk dan belum resign pada akhir tiap bulan. Bulan terakhir dihitung sampai tanggal terpilih. Sumber: Tanggal Masuk &amp; Tanggal Resign.' });
    },
    trendTbl: () => {
        const R = trendRows(), sg = n => n > 0 ? '+' + n : String(n);
        return tbl('tren_headcount', 'Tabel Tren Headcount Aktif per Bulan', [
            { l: 'Bulan', raw: 1, c: r => esc(r.label) },
            { l: 'Headcount Awal', raw: 1, c: r => nf(r.awal) },
            { l: 'Masuk Baru', raw: 1, c: r => nf(r.masuk) },
            { l: 'Resign', raw: 1, c: r => nf(r.resign) },
            { l: 'Headcount Akhir', raw: 1, c: r => `<b>${nf(r.akhir)}</b>` },
            { l: 'Perubahan', raw: 1, c: r => sg(r.akhir - r.awal) }
        ], { ro: 1, rows: R });
    },
    headBlock: () => `<div class="g">${G.head()}${G.headTrend()}</div><div class="g">${G.headTbl()}${G.trendTbl()}</div>`,
    funnel: () => chart('Funnel Kandidat per Tahap', 'bar', DB.funnel.map(r => r.tahap), [{ label: 'Kandidat', data: DB.funnel.map(r => +r.jumlah) }], { h: 1 }),
    mp: () => chart('Status Pengajuan Manpower', 'doughnut', L.mp, [{ data: cnts(DB.manpower, 'status', L.mp) }]),
    add: () => chart('Penambahan Karyawan per Bulan', 'bar', MON, [{ label: 'Penambahan', data: MON.map((_, i) => cnt(DB.karyawan, k => k.tgl_masuk && k.tgl_masuk.slice(0, 7) == X.y + '-' + String(i + 1).padStart(2, '0'))) }]),
    hadir: () => chart('Persentase Kehadiran per Bulan (%)', 'bar', DB.kehadiran.map(r => bl(r.bulan)), [{ label: '% Hadir', data: DB.kehadiran.map(pct) }]),
    honor: () => chart('Total Honor per Status (Rp)', 'bar', L.hon, [{ label: 'Rp', data: L.hon.map((_, i) => X['h' + i]) }]),
    lemS: () => chart('Jam Lembur per Status', 'doughnut', L.hon, [{ data: L.hon.map(h => Math.round(sum(DB.lembur.filter(r => lst(r.tanggal) == h), jam) * 100) / 100) }]),
    lemT: () => { const t = [...new Set(DB.lembur.map(r => r.tanggal))].sort(); return chart('Jam Lembur per Tanggal', 'bar', t.map(fd), [{ label: 'Jam', data: t.map(x => sum(DB.lembur.filter(r => r.tanggal == x), jam)) }]); },
    memo: () => chart('Status Memo', 'doughnut', L.memo, [{ data: cnts(DB.memo, 'status', L.memo) }]),
    sp: () => chart('Status SP', 'doughnut', ['Berlaku', 'Kadaluarsa'], [{ data: [X.spOk, X.spEx] }]),
    plg: () => chart('Pelanggaran per Kategori', 'bar', L.kat, [{ label: 'Jumlah', data: cnts(DB.pelanggaran, 'kategori', L.kat) }])
};
const adm = t => tbl('karyawan', 'Karyawan ' + t, ['nik', 'nama', 'departemen', 'tgl_masuk', 'tgl_resign', 'status'], { rows: DB.karyawan.filter(k => k.tipe == t), def: { tipe: t, status: 'Aktif' } });
const nama = { l: 'Nama', c: r => nm(r.nik) };
// ---------- daftar gabungan semua jenis karyawan + sort + impor Excel
const sv = v => String(v ?? ''), tpIdx = t => { const i = L.tipe.indexOf(t); return i < 0 ? 99 : i; };
const ADMSORTERS = {
    nama: (a, b) => sv(a.nama).localeCompare(sv(b.nama)),
    status: (a, b) => sv(a.status).localeCompare(sv(b.status)) || tpIdx(a.tipe) - tpIdx(b.tipe) || sv(a.nama).localeCompare(sv(b.nama)),
    tipe: (a, b) => tpIdx(a.tipe) - tpIdx(b.tipe) || sv(a.nama).localeCompare(sv(b.nama)),
    departemen: (a, b) => sv(a.departemen).localeCompare(sv(b.departemen)) || sv(a.nama).localeCompare(sv(b.nama)),
    tgl_masuk: (a, b) => sv(b.tgl_masuk).localeCompare(sv(a.tgl_masuk)) || sv(a.nama).localeCompare(sv(b.nama))
};
function admAll() {
    const rows = [...DB.karyawan].sort(ADMSORTERS[ADMSORT] || ADMSORTERS.nama);
    const opt = (v, l) => `<option value="${v}"${ADMSORT == v ? ' selected' : ''}>${l}</option>`;
    const cols = [col('karyawan', 'nik'), col('karyawan', 'nama'), col('karyawan', 'departemen'), col('karyawan', 'tipe'), col('karyawan', 'tgl_masuk'), col('karyawan', 'status'), col('karyawan', 'jabatan')];
    const cell = (r, c) => { const v = c.c ? c.c(r) : r[c.k]; if (v == null || v === '')
        return ''; return c.ty == 'b' ? bd(v) : c.ty == 'd' ? fd(v) : esc(v); };
    return `<div class="card"><div class="ch"><h3>Semua Karyawan (Tetap · Kontrak · PHL)</h3><input class="q" placeholder="Cari…">
  <select id="admSortSel" class="btn">${opt('nama', 'Urutkan: Nama (A-Z)')}${opt('status', 'Urutkan: Status')}${opt('tipe', 'Urutkan: Tipe')}${opt('departemen', 'Urutkan: Departemen')}${opt('tgl_masuk', 'Urutkan: Tgl Masuk (terbaru)')}</select>
  ${ADMIN ? `<label class="btn p imp" title="Impor daftar karyawan dari file Excel">⬆ Impor Excel<input type="file" id="impFile" accept=".xlsx,.xls,.csv" hidden></label>
  <button class="btn" data-a="tpl" data-t="karyawan" title="Unduh template Excel untuk impor">⬇ Template</button>` : ''}
  <button class="btn" data-a="export" data-t="semua_karyawan">⬇ Export Excel</button>
  ${ADMIN ? '<button class="btn p" data-a="add" data-t="karyawan" data-def=\'{"status":"Aktif"}\'>＋ Tambah</button>' : ''}</div>
  <div class="tw"><table><thead><tr>${cols.map(c => `<th>${c.l}</th>`).join('')}${ADMIN ? '<th></th>' : ''}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${cell(r, c)}</td>`).join('')}${ADMIN ? `<td class="ac"><button data-a="edit" data-t="karyawan" data-id="${r.id}" title="Ubah">✎</button><button data-a="del" data-t="karyawan" data-id="${r.id}" title="Hapus">🗑</button></td>` : ''}</tr>`).join('') || '<tr><td colspan="99" class="empty">Belum ada data</td></tr>'}</tbody></table></div></div>`;
}
export function exportTable(card, filename) {
    const table = $('table', card);
    if (!table)
        return;
    const ths = [...table.querySelectorAll('thead th')], hasAction = ths.length && ths[ths.length - 1].textContent.trim() === '';
    const head = ths.slice(0, hasAction ? -1 : undefined).map(th => th.textContent.trim());
    const rows = [...table.querySelectorAll('tbody tr')].filter(tr => !tr.hidden && !tr.querySelector('.empty')).map(tr => [...tr.children].slice(0, hasAction ? -1 : undefined).map(td => td.textContent.trim()));
    const ws = XLSX.utils.aoa_to_sheet([head, ...rows]), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename + '.xlsx');
}
const pad2 = n => String(n).padStart(2, '0'), NORM = x => String(x ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const BLN = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
const ymd = (y, m, d) => (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31 && +y >= 1900) ? y + '-' + pad2(m) + '-' + pad2(d) : '';
function xlVal2date(v) {
    if (v instanceof Date)
        return isNaN(v) ? '' : iso(v);
    if (typeof v == 'number') {
        if (v > 20000 && v < 80000) {
            const d = new Date(Math.round((v - 25569) * 864e5));
            return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
        }
        return '';
    }
    if (typeof v == 'string') {
        const t = v.trim();
        if (!t)
            return '';
        let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m)
            return ymd(m[1], m[2], m[3]);
        m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
        if (m)
            return ymd(+m[3] < 100 ? 2000 + +m[3] : m[3], m[2], m[1]);
        m = t.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/);
        if (m && BLN[m[2].slice(0, 3).toLowerCase()])
            return ymd(m[3], BLN[m[2].slice(0, 3).toLowerCase()], m[1]);
    }
    return '';
}
const ALIAS = {
    nik: ['nik', 'nomorindukkaryawan', 'noinduk', 'idkaryawan'],
    nama: ['nama', 'namalengkap', 'namakaryawan'],
    departemen: ['departemen', 'dept', 'department', 'divisi', 'bagian'],
    tipe: ['tipe', 'tipekaryawan', 'jeniskaryawan'],
    tgl_masuk: ['tanggalmasuk', 'tglmasuk', 'tglbergabung', 'tanggalbergabung', 'joindate'],
    tgl_resign: ['tanggalresign', 'tglresign'],
    status: ['status', 'statuskaryawan'],
    jabatan: ['jabatan', 'posisi'],
    alasan_resign: ['alasanresign', 'alasan'],
    no_kontrak: ['nokontrak', 'nomorkontrak', 'nokontrakkerja'],
    jenis_kontrak: ['jeniskontrak'],
    mulai_kontrak: ['mulaikontrak', 'tanggalmulaikontrak', 'tglmulaikontrak', 'mulai', 'awalkontrak'],
    berakhir: ['berakhir', 'berakhirkontrak', 'akhirkontrak', 'tanggalberakhir', 'tglberakhir', 'selesaikontrak']
};
function readRow(r) {
    const m = {}, out = {};
    Object.keys(r).forEach(k => { m[NORM(k)] = r[k]; });
    Object.keys(ALIAS).forEach(f => { for (const a of ALIAS[f])
        if (m[a] !== undefined && m[a] !== '') {
            out[f] = m[a];
            break;
        } });
    return out;
}
const normDept = v => { const t = sv(v).trim(); return t ? (DEPT.find(d => d.toLowerCase() == t.toLowerCase()) || t) : ''; };
const normTipe = v => { const t = sv(v).toLowerCase(); return /tetap|permanent/.test(t) ? 'Tetap' : /kontrak|contract|pkwt/.test(t) ? 'Kontrak' : /phl|harian|lepas|magang|trainee/.test(t) ? 'PHL' : ''; };
const normStatus = v => { const t = sv(v).toLowerCase(); return /resign|keluar|non ?aktif/.test(t) ? 'Resign' : /aktif|active/.test(t) ? 'Aktif' : ''; };
const normJK = v => { const t = sv(v).trim().toUpperCase(); return t; };
export function downloadTemplate(kind) {
    const aoa = kind == 'kontrak'
        ? [['NIK', 'Nama', 'Departemen', 'Jabatan', 'No. Kontrak', 'Jenis Kontrak', 'Mulai Kontrak', 'Berakhir'], ['EMP101', 'Contoh Nama', 'General Affairs', 'Staff GA', 'KK/HC/2026/010', 'PKWT', '2026-01-01', '2026-12-31']]
        : [['NIK', 'Nama', 'Departemen', 'Tipe', 'Tanggal Masuk', 'Tanggal Resign', 'Status', 'Jabatan', 'Alasan Resign'], ['EMP101', 'Contoh Nama', 'General Affairs', 'Kontrak', '2026-01-01', '', 'Aktif', 'Staff GA', '']];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Data');
    XLSX.writeFile(wb, kind == 'kontrak' ? 'template_kontrak_kerja.xlsx' : 'template_karyawan.xlsx');
}
// mode: 'karyawan' (daftar karyawan) | 'kontrak' (Kontrak Kerja di Employee Relations)
// NIK sudah ada -> data DIPERBARUI, NIK baru -> DITAMBAHKAN. Mengembalikan ringkasan, atau null bila dibatalkan.
export async function importKaryawan(file, mode = 'karyawan') {
    const buf = await file.arrayBuffer(), wb = XLSX.read(buf, { type: 'array' }), ws = wb.Sheets[wb.SheetNames[0]], raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!raw.length) {
        alert('File Excel kosong atau format tidak sesuai.');
        return null;
    }
    const rows = raw.map(readRow);
    if (!rows.some(r => r.nik)) {
        alert('Kolom "NIK" tidak ditemukan di baris pertama file. Gunakan tombol Template supaya nama kolomnya sesuai.');
        return null;
    }
    const kon = mode == 'kontrak';
    if (!confirm(`Impor ${rows.length} baris ${kon ? 'kontrak kerja' : 'data karyawan'}?\nNIK yang sudah ada akan DIPERBARUI, NIK baru akan DITAMBAHKAN.`))
        return null;
    const jobs = [], errors = [], seen = new Set(), blank = () => { const o = {}; T.karyawan.forEach(f => o[f.k] = ''); return o; };
    rows.forEach((r, i) => {
        const line = i + 2, nik = sv(r.nik).trim();
        if (!nik) {
            errors.push(`Baris ${line}: NIK kosong`);
            return;
        }
        if (seen.has(nik.toLowerCase())) {
            errors.push(`Baris ${line}: NIK ${nik} ganda di file`);
            return;
        }
        seen.add(nik.toLowerCase());
        const ex = DB.karyawan.find(k => sv(k.nik).trim().toLowerCase() == nik.toLowerCase()), p = blank();
        if (ex)
            T.karyawan.forEach(f => p[f.k] = ex[f.k] ?? '');
        else {
            if (!sv(r.nama).trim()) {
                errors.push(`Baris ${line}: ${nik} belum terdaftar dan Nama kosong`);
                return;
            }
            p.nik = nik;
            p.tipe = kon ? 'Kontrak' : 'Kontrak';
            p.status = 'Aktif';
        }
        const set = (k, v) => { if (v !== '' && v != null)
            p[k] = v; };
        set('nama', sv(r.nama).trim());
        set('departemen', normDept(r.departemen));
        set('jabatan', sv(r.jabatan).trim());
        set('tgl_masuk', xlVal2date(r.tgl_masuk));
        set('tgl_resign', xlVal2date(r.tgl_resign));
        set('alasan_resign', sv(r.alasan_resign).trim());
        set('tipe', normTipe(r.tipe));
        set('status', normStatus(r.status));
        if (!normStatus(r.status) && xlVal2date(r.tgl_resign))
            p.status = 'Resign';
        if (kon) {
            set('no_kontrak', sv(r.no_kontrak).trim());
            set('jenis_kontrak', normJK(r.jenis_kontrak));
            set('mulai_kontrak', xlVal2date(r.mulai_kontrak));
            set('berakhir', xlVal2date(r.berakhir));
            if (p.jenis_kontrak != 'PKWTT' || !ex)
                p.tipe = 'Kontrak';
            if (!p.jenis_kontrak)
                p.jenis_kontrak = 'PKWT';
            if (p.mulai_kontrak && p.berakhir && p.berakhir < p.mulai_kontrak) {
                errors.push(`Baris ${line}: ${nik} tanggal berakhir sebelum mulai kontrak`);
                return;
            }
            if (!p.tgl_masuk && p.mulai_kontrak && !ex)
                p.tgl_masuk = p.mulai_kontrak;
        }
        jobs.push({ line, nik, id: ex ? ex.id : undefined, isNew: !ex, p });
    });
    let baru = 0, update = 0;
    for (let i = 0; i < jobs.length; i += 5) {
        const batch = jobs.slice(i, i + 5), res = await Promise.allSettled(batch.map(j => api('karyawan', 'POST', j.p, j.id)));
        res.forEach((x, n) => { const j = batch[n]; if (x.status == 'fulfilled') { j.isNew ? baru++ : update++; } else
            errors.push(`Baris ${j.line}: ${j.nik} gagal disimpan (${x.reason && x.reason.message || 'error'})`); });
    }
    return { baru, update, errors, total: rows.length };
}
export const importSummary = r => `Impor selesai.\n• Ditambahkan: ${r.baru}\n• Diperbarui: ${r.update}\n• Gagal/dilewati: ${r.errors.length}` + (r.errors.length ? '\n\n' + r.errors.slice(0, 8).join('\n') + (r.errors.length > 8 ? `\n… dan ${r.errors.length - 8} lainnya` : '') : '');
// ---------- notifikasi
export function notifList() {
    if (!DB.karyawan) return []; // data belum selesai dimuat dari server — jangan hitung dulu
    const n = [];
    DB.karyawan.filter(k => k.tipe == 'Kontrak').forEach(k => {
        const st = kst(k);
        if (st == 'Segera Berakhir')
            n.push({ level: 'wa', text: `Kontrak ${k.nama} (${k.departemen}) berakhir ${dd(k.berakhir, SEL)} hari lagi — ${fd(k.berakhir)}`, href: '#/administrasi' });
        else if (st == 'Berakhir')
            n.push({ level: 'er', text: `Kontrak ${k.nama} (${k.departemen}) sudah berakhir sejak ${fd(k.berakhir)}, segera perbarui`, href: '#/er' });
    });
    DB.sp.forEach(r => { const x = spx(r); if (x.st == 'Berlaku' && x.s <= 7)
        n.push({ level: 'wa', text: `${r.jenis_sp} a.n. ${nm(r.nik)} akan kadaluarsa ${x.s} hari lagi`, href: '#/er' }); });
    DB.lowongan.forEach(r => { if (r.target_selesai && r.target_selesai < SEL && r.status != 'Closed')
        n.push({ level: 'er', text: `Lowongan ${r.posisi} (${r.departemen}) sudah lewat target selesai`, href: '#/recruitment' }); });
    const mpW = cnt(DB.manpower, r => r.status == 'Diajukan');
    if (mpW)
        n.push({ level: 'in', text: `${mpW} pengajuan manpower menunggu persetujuan`, href: '#/recruitment' });
    const ctW = cnt(DB.cuti, r => r.status == 'Diajukan');
    if (ctW)
        n.push({ level: 'in', text: `${ctW} pengajuan cuti menunggu persetujuan`, href: '#/hc' });
    const lmW = cnt(DB.lembur, r => lst(r.tanggal) == 'Belum diajukan');
    if (lmW)
        n.push({ level: 'in', text: `${lmW} entri lembur belum diajukan pembayarannya`, href: '#/tugas' });
    const ord = { er: 0, wa: 1, in: 2 };
    n.sort((a, b) => ord[a.level] - ord[b.level]);
    return n;
}
// ---------- halaman
export const P = {
    dashboard: () => head('Dashboard Human Capital', 'Ringkasan seluruh halaman. Seluruh angka dan grafik terhubung otomatis ke database dan mengikuti tanggal terpilih.') +
        kpis([kpi('Karyawan aktif', X.aktif, 'Tetap + kontrak + PHL'), kpi('Lowongan aktif', X.lw, 'Open & On Progress', 1), kpi('Kehadiran (periode)', (X.hadir * 100).toFixed(1) + '%', 'Masuk ÷ (basis × hari kerja)', 3), kpi('SPD berjalan', X.spdJalan, 'Surat dinas aktif', 2), kpi('SP berlaku', X.spOk, 'Masih dalam masa berlaku', 4), kpi('Memo draft', X.draft, 'Belum diterbitkan', 5)]) +
        sec('Recruitment', 'recruitment', kpis([kpi('Manpower diterima', X.mpOk), kpi('Lowongan aktif', X.lw, '', 1), kpi('Total pelamar', X.pel, '', 2), kpi('Kandidat diproses', X.proses, '', 3), kpi('Kandidat diterima', X.fnOk, '', 4), kpi('Onboarding (thn ini)', X.onb, '', 5)]) + `<div class="g">${G.funnel()}${G.mp()}${G.add()}</div>`) +
        sec('Operasional HC (Kehadiran & Cuti)', 'hc', kpis([kpi('Rata-rata kehadiran', (X.hadir * 100).toFixed(1) + '%'), kpi('Karyawan masuk', nf(X.masuk), 'orang-hari', 1), kpi('Izin / sakit', nf(X.izin), 'orang-hari', 2), kpi('Cuti', nf(X.cuti), 'orang-hari', 3), kpi('Dinas luar kota', nf(X.dinas), 'orang-hari', 4), kpi('Resign (periode)', X.resignP, '', 5)]) + `<div class="g">${G.hadir()}</div>`) +
        sec('Operasional Dinas', 'dinas', kpis([kpi('SPD berjalan', X.spdJalan), kpi('SPD tahun ini', X.spdTahun, '', 1), kpi('SPD bulan ini', X.spdBulan, '', 2), kpi('Honor belum diajukan', rp(X.h0), '', 3), kpi('Honor diajukan', rp(X.h1), '', 4), kpi('Honor dibayar', rp(X.h2), '', 5)]) + `<div class="g">${G.honor()}</div>`) +
        sec('Operasional Tugas', 'tugas', kpis([kpi('Total surat lembur', X.sl), kpi('Total jam lembur', X.jam, '', 1), kpi('Belum diajukan (jam)', X.jamB, '', 2), kpi('Sudah diajukan (jam)', X.jamS, '', 3), kpi('Surat tugas (total)', X.st, 'Area Jabodetabek', 4), kpi('Surat tugas aktif', X.stAktif, 'Berjalan hari ini', 5)]) + `<div class="g">${G.lemS()}${G.lemT()}</div>`) +
        sec('Administrasi', 'administrasi', kpis([kpi('Karyawan tetap', X.Tetap), kpi('Karyawan kontrak', X.Kontrak, '', 1), kpi('PHL', X.PHL, '', 2), kpi('Total aktif', X.aktif, '', 3), kpi('Resign (total)', X.resign, '', 4), kpi('Kontrak segera berakhir', X.segera, 'Sisa ≤ 30 hari', 5)]) + `${G.headBlock()}`) +
        sec('Administrasi Memo', 'memo', kpis([kpi('Total memo', X.memo), kpi('Memo terbit', X.terbit, '', 3), kpi('Memo draft', X.draft, '', 2), kpi('Memo bulan ini', X.memoB, '', 1)]) + `<div class="g">${G.memo()}</div>`) +
        sec('Employee Relations', 'er', kpis([kpi('Pelanggaran (thn ini)', X.plgY), kpi('Pelanggaran berat', X.Berat, '', 4), kpi('SP berlaku', X.spOk, '', 2), kpi('SP kadaluarsa', X.spEx, '', 5), kpi('Pelanggaran ringan', X.Ringan, '', 1), kpi('Pelanggaran sedang', X.Sedang, '', 3)]) + `<div class="g">${G.sp()}${G.plg()}</div>`),
    recruitment: () => head('Recruitment', 'Pengajuan manpower, lowongan aktif, funnel kandidat, onboarding, dan penambahan karyawan.') +
        kpis([kpi('Manpower diterima', X.mpOk), kpi('Lowongan aktif', X.lw, '', 1), kpi('Total pelamar', X.pel, '', 2), kpi('Kandidat diproses', X.proses, '', 3), kpi('Kandidat diterima', X.fnOk, '', 4), kpi('Onboarding (thn ini)', X.onb, '', 5)]) +
        tbl('manpower', 'Pengajuan Manpower', ['no_pengajuan', 'tgl_pengajuan', 'departemen', 'posisi', 'jumlah', 'alasan', 'pemohon', 'status', 'tgl_keputusan']) +
        tbl('lowongan', 'Lowongan Aktif', ['posisi', 'departemen', 'tgl_buka', 'kebutuhan', 'pelamar', 'diterima', 'status', 'target_selesai', { l: 'Progres Hire', raw: 1, c: r => { const p = r.kebutuhan > 0 ? Math.round(r.diterima / r.kebutuhan * 100) : 0; return `<span class="pb"><i style="width:${p}%"></i></span>${p}%`; } }]) +
        `<div class="g"><div>${tbl('funnel', 'Funnel Kandidat (isi jumlah manual)', ['tahap', 'jumlah'])}</div>${G.funnel()}${G.mp()}</div>` +
        tbl('onboarding', 'Onboarding Karyawan Baru', ['nama', 'posisi', 'divisi', 'tgl_onboarding', 'tgl_mulai', 'pj', 'status', 'keterangan']) + `<div class="g">${G.add()}</div>`,
    hc: () => head('Operasional HC', 'Rekapan bulanan kehadiran dan rekapan cuti karyawan.') +
        kpis([kpi('Rata-rata kehadiran', (X.hadir * 100).toFixed(1) + '%'), kpi('Karyawan masuk', nf(X.masuk), 'orang-hari', 1), kpi('Izin / sakit', nf(X.izin), '', 2), kpi('Cuti', nf(X.cuti), '', 3), kpi('Dinas luar kota', nf(X.dinas), '', 4), kpi('Resign (periode)', X.resignP, '', 5), kpi('Total hari kerja', X.hari), kpi('Karyawan aktif (basis)', X.basis, 'Ubah di tabel Pengaturan', 1)]) +
        `<div class="g w">${G.hadir()}${tbl('pengaturan', 'Pengaturan (basis_manual = jumlah karyawan basis; kosongkan nilai untuk otomatis dari data)', ['kunci', 'nilai'])}</div>` +
        tbl('kehadiran', 'A. Rekapan Bulanan', [{ l: 'Bulan', c: r => bl(r.bulan) }, 'hari_kerja', 'masuk', 'izin_sakit', 'cuti', 'dinas', { l: 'Resign (otomatis)', c: r => resM(r.bulan) }, { l: '% Kehadiran', c: r => pct(r) + '%' }, 'keterangan']) +
        tbl('cuti', 'B. Rekapan Cuti Karyawan', ['tgl_pengajuan', 'nik', nama, 'jenis_cuti', 'mulai', 'selesai', { l: 'Hari Kerja', c: r => r.mulai && r.selesai ? netdays(r.mulai, r.selesai) : '' }, 'status', 'keterangan']),
    dinas: () => head('Operasional Dinas', 'Surat Perjalanan Dinas (SPD) dan Surat Upah Perjalanan Dinas (honor).') +
        kpis([kpi('SPD berjalan', X.spdJalan), kpi('SPD tahun ini', X.spdTahun, '', 1), kpi('SPD bulan ini', X.spdBulan, '', 2), kpi('Honor belum diajukan', rp(X.h0), '', 3), kpi('Honor diajukan', rp(X.h1), '', 4), kpi('Honor dibayar', rp(X.h2), '', 5)]) +
        tbl('spd', 'A. Surat Perjalanan Dinas (SPD) — Keluar Kota', ['no_surat', 'tgl_surat', 'nik', nama, 'kota', 'berangkat', 'kembali', { l: 'Durasi (hari)', c: r => dur(r.berangkat, r.kembali) }, 'keperluan']) +
        `<div class="g w">${tbl('honor', 'B. Surat Upah Perjalanan Dinas (Honor)', ['no_spd', { l: 'Nama', c: r => nm((DB.spd.find(s => s.no_surat == r.no_spd) || {}).nik) }, { l: 'Nominal', ty: 'n', rp: 1, c: r => r.nominal }, 'tgl_pengajuan', 'status', 'tgl_dibayar', 'keterangan'])}${G.honor()}</div>`,
    tugas: () => {
        const tg = [...new Set(DB.lembur.map(r => r.tanggal))].sort(), kn = [...new Set(DB.lembur.map(r => r.nik))];
        return head('Operasional Tugas', 'Surat Tugas area Jabodetabek dan pengajuan upah lembur.') +
            kpis([kpi('Total surat lembur', X.sl), kpi('Total jam lembur', X.jam, '', 1), kpi('Belum diajukan (jam)', X.jamB, '', 2), kpi('Sudah diajukan (jam)', X.jamS, '', 3), kpi('Surat tugas (total)', X.st, '', 4), kpi('Surat tugas aktif', X.stAktif, '', 5)]) +
            tbl('surat_tugas', 'Surat Tugas (Area Jabodetabek)', ['no_surat', 'tanggal', 'nik', nama, 'tujuan', 'mulai', 'selesai', { l: 'Durasi (hari)', c: r => dur(r.mulai, r.selesai) }]) +
            tbl('lembur', 'Surat Pengajuan Upah Lembur', ['no_surat', 'tanggal', 'nik', nama, 'jam_mulai', 'jam_selesai', 'hari_lembur', { l: 'Durasi (jam)', c: jam }, { l: 'Status Pengajuan', bd: 1, c: r => lst(r.tanggal) }]) +
            `<div class="g w">${tbl('lembur_status', 'Status Penggajian per Tanggal Lembur', ['tanggal', { l: 'Jumlah Karyawan', c: r => cnt(DB.lembur, x => x.tanggal == r.tanggal) }, { l: 'Total Jam', c: r => sum(DB.lembur.filter(x => x.tanggal == r.tanggal), jam) }, 'status', 'tgl_pengajuan'])}${tbl('lembur', 'Total Jam Lembur per Karyawan', ['nik', { l: 'Nama', c: r => r.nama }, { l: 'Total Jam', c: r => r.jam }], { ro: 1, rows: kn.map(n => ({ nik: n, nama: nm(n), jam: Math.round(sum(DB.lembur.filter(x => x.nik == n), jam) * 100) / 100 })) })}</div><div class="g">${G.lemS()}${G.lemT()}</div>`;
    },
    administrasi: () => head('Administrasi', 'Daftar karyawan Tetap, Kontrak, dan PHL (termasuk trainee).') +
        kpis([kpi('Karyawan tetap', X.Tetap), kpi('Karyawan kontrak', X.Kontrak, '', 1), kpi('PHL', X.PHL, '', 2), kpi('Total aktif', X.aktif, '', 3), kpi('Resign (total)', X.resign, '', 4), kpi('Kontrak segera berakhir', X.segera, 'Sisa ≤ 30 hari', 5)]) +
        `<div class="g w">${adm('Tetap')}${adm('Kontrak')}${adm('PHL')}</div>` + admAll() + `${G.headBlock()}`,
    memo: () => head('Administrasi Memo', 'Memo internal perusahaan. Ubah status (Draft / Terbit / Arsip) lewat tombol ubah.') +
        kpis([kpi('Total memo', X.memo), kpi('Memo terbit', X.terbit, '', 3), kpi('Memo draft', X.draft, '', 2), kpi('Memo bulan ini', X.memoB, '', 1)]) +
        `<div class="g w">${tbl('memo', 'A. Daftar Memo', ['no_memo', 'tanggal', 'perihal', 'tujuan', 'dari', 'status', 'keterangan'])}${G.memo()}</div>`,
    er: () => head('Employee Relations', 'Pelanggaran karyawan, surat peringatan (SP), dan kontrak kerja.') +
        kpis([kpi('Pelanggaran (thn ini)', X.plgY), kpi('Pelanggaran berat', X.Berat, '', 4), kpi('SP berlaku', X.spOk, '', 2), kpi('SP kadaluarsa', X.spEx, '', 5), kpi('Pelanggaran ringan', X.Ringan, '', 1), kpi('Pelanggaran sedang', X.Sedang, '', 3)]) +
        tbl('pelanggaran', 'A. Daftar Pelanggaran', ['no_plg', 'tanggal', 'nik', nama, 'jenis', 'kategori', 'uraian', 'tindak_lanjut']) +
        tbl('sp', 'B. Surat Peringatan (SP)', ['no_sp', 'nik', nama, { l: 'Departemen', c: r => (DB.karyawan.find(k => k.nik == r.nik) || {}).departemen }, 'jenis_sp', 'tgl_terbit', 'masa_berlaku', { l: 'Batas Berlaku', ty: 'd', c: r => spx(r).b }, { l: 'Sisa Hari', c: r => spx(r).s }, { l: 'Status', bd: 1, c: r => spx(r).st }, 'no_pelanggaran']) +
        `<div class="g">${G.sp()}${G.plg()}</div>` +
        tbl('karyawan', 'C. Kontrak Kerja', ['nik', 'nama', 'departemen', 'no_kontrak', 'jenis_kontrak', 'mulai_kontrak', 'berakhir', { l: 'Sisa Hari', c: r => r.berakhir ? dd(r.berakhir, SEL) : '' }, { l: 'Status Kontrak', bd: 1, c: kst }], { rows: DB.karyawan.filter(k => k.tipe == 'Kontrak'), def: { tipe: 'Kontrak', status: 'Aktif', jenis_kontrak: 'PKWT' }, extra: '<label class="btn p imp" title="Impor kontrak kerja dari file Excel">⬆ Impor Excel<input type="file" id="impKontrak" accept=".xlsx,.xls,.csv" hidden></label><button class="btn" data-a="tpl" data-t="kontrak" title="Unduh template Excel untuk impor">⬇ Template</button>' })
};
