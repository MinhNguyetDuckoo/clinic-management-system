import { getDbPool } from "../../config/database";

function formatSqlTime(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().substring(11, 19);
  }

  return String(value).substring(0, 8);
}

export async function getActiveDoctors() {
  const pool = await getDbPool();

  const result = await pool.request().query(`
    SELECT
      d.DoctorId,
      e.UserId,
      u.FullName AS DoctorName,
      s.SpecialtyName
    FROM Doctors d
    INNER JOIN Employees e ON d.EmployeeId = e.EmployeeId
    INNER JOIN Users u ON e.UserId = u.UserId
    INNER JOIN Specialties s ON d.SpecialtyId = s.SpecialtyId
    WHERE d.IsActive = 1
      AND e.IsActive = 1
      AND e.IsDeleted = 0
      AND u.IsActive = 1
      AND u.IsDeleted = 0
    ORDER BY u.FullName
  `);

  return result.recordset;
}

export async function getDoctorSchedules(doctorId: number, workDate: string) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("DoctorId", doctorId)
    .input("WorkDate", workDate)
    .query(`
      SELECT
        ds.ScheduleId,
        ds.DoctorId,
        ds.RoomId,
        r.RoomName,
        ds.WorkDate,
        ds.StartTime,
        ds.EndTime,
        ds.MaxPatients
      FROM DoctorSchedules ds
      LEFT JOIN Rooms r ON ds.RoomId = r.RoomId
      WHERE ds.DoctorId = @DoctorId
        AND ds.WorkDate = @WorkDate
        AND ds.IsActive = 1
      ORDER BY ds.StartTime
    `);

  return result.recordset.map((item) => ({
    ...item,
    StartTime: formatSqlTime(item.StartTime),
    EndTime: formatSqlTime(item.EndTime)
  }));
}

export async function getDoctorExaminations(doctorId: number, workDate?: string) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("DoctorId", doctorId)
    .input("WorkDate", workDate ?? null)
    .query(`
      SELECT
        ex.ExaminationId,
        ex.DoctorId,
        ex.Status AS ExaminationStatus,
        ex.Symptoms,
        ex.Diagnosis,
        ex.Conclusion,
        ex.StartedAt,
        ex.FinishedAt,
        a.AppointmentId,
        a.AppointmentDate,
        a.AppointmentTime,
        a.Status AS AppointmentStatus,
        a.Reason,
        p.PatientId,
        p.PatientCode,
        p.FullName AS PatientName,
        p.Phone AS PatientPhone,
        r.RoomName,
        mr.RecordCode
      FROM Examinations ex
      INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
      INNER JOIN Patients p ON a.PatientId = p.PatientId
      INNER JOIN MedicalRecords mr ON ex.MedicalRecordId = mr.MedicalRecordId
      LEFT JOIN Rooms r ON a.RoomId = r.RoomId
      WHERE ex.DoctorId = @DoctorId
        AND (@WorkDate IS NULL OR a.AppointmentDate = @WorkDate)
      ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC
    `);

  return result.recordset.map((item) => ({
    ...item,
    AppointmentTime: formatSqlTime(item.AppointmentTime)
  }));
}
