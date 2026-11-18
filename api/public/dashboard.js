import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metode tidak didukung' });
    return;
  }

  try {
    const [employees, departments, companies, recruitment, attendance, trips, publicMemos] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Aktif')::int AS active,
          COUNT(*) FILTER (WHERE status = 'Resign')::int AS resigned,
          COUNT(*)::int AS total
        FROM karyawan
      `),
      query(`
        SELECT departemen AS name, COUNT(*)::int AS total
        FROM karyawan
        WHERE status = 'Aktif' AND COALESCE(departemen, '') <> ''
        GROUP BY departemen
        ORDER BY total DESC, departemen ASC
      `),
      query(`
        SELECT perusahaan AS name, COUNT(*)::int AS total
        FROM karyawan
        WHERE status = 'Aktif' AND COALESCE(perusahaan, '') <> ''
        GROUP BY perusahaan
        ORDER BY perusahaan ASC
      `),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('Open', 'On Progress'))::int AS active_vacancies,
          COALESCE(SUM(pelamar), 0)::int AS applicants
        FROM lowongan
      `),
      query(`
        SELECT
          COALESCE(SUM(hari_kerja), 0)::int AS work_days,
          COALESCE(SUM(masuk), 0)::int AS attendance,
          COALESCE(SUM(izin_sakit), 0)::int AS sick_leave,
          COALESCE(SUM(cuti), 0)::int AS leave_days,
          COALESCE(SUM(dinas), 0)::int AS business_trips
        FROM kehadiran
      `),
      query(`
        SELECT COUNT(*)::int AS active_trips
        FROM spd
        WHERE berangkat <= CURRENT_DATE AND kembali >= CURRENT_DATE
      `),
      query(`
        SELECT COUNT(*)::int AS published_memos
        FROM memo
        WHERE untuk_semua_karyawan = TRUE AND status = 'Terbit'
      `),
    ]);

    const employee = employees.rows[0] || {};
    const attendanceData = attendance.rows[0] || {};
    const [setting] = await Promise.all([
      query(`SELECT nilai FROM pengaturan WHERE kunci = 'basis_manual' LIMIT 1`)
    ]);
    const active = Number(employee.active || 0);
    const basis = Number(setting.rows[0]?.nilai || active);
    const workDays = Number(attendanceData.work_days || 0);
    const attendanceRate = workDays && basis
      ? Number((Number(attendanceData.attendance || 0) / (basis * workDays) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      employees: {
        active,
        resigned: Number(employee.resigned || 0),
        total: Number(employee.total || 0),
        byDepartment: departments.rows,
        byCompany: companies.rows,
      },
      recruitment: {
        activeVacancies: Number(recruitment.rows[0]?.active_vacancies || 0),
        applicants: Number(recruitment.rows[0]?.applicants || 0),
      },
      attendance: {
        rate: attendanceRate,
        attendance: Number(attendanceData.attendance || 0),
        sickLeave: Number(attendanceData.sick_leave || 0),
        leaveDays: Number(attendanceData.leave_days || 0),
        businessTrips: Number(attendanceData.business_trips || 0),
      },
      operations: {
        activeTrips: Number(trips.rows[0]?.active_trips || 0),
        publishedMemos: Number(publicMemos.rows[0]?.published_memos || 0),
      },
    });
  } catch (error) {
    console.error('Public dashboard API error:', error);
    res.status(500).json({ error: 'Dashboard publik tidak dapat dimuat.' });
  }
}
