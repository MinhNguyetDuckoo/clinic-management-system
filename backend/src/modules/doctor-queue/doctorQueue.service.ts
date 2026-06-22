import { getDbPool, sql } from "../../config/database";

type DiagnosisPayload = {
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  doctorUserId?: number | null;
};

export async function getDoctorTodayQueueService(doctorId: number) {
  if (!doctorId) {
    throw new Error("DoctorId không hợp lệ.");
  }

  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("DoctorId", sql.Int, doctorId)
    .query(`
      SELECT *
      FROM vw_Doctor_TodayQueue
      WHERE DoctorId = @DoctorId
      ORDER BY AppointmentTime ASC
    `);

  return result.recordset;
}

async function resolveExaminationId(
  pool: sql.ConnectionPool,
  examinationId: number | null,
  appointmentId: number | null
) {
  if (examinationId) {
    return examinationId;
  }

  if (!appointmentId) {
    throw new Error("Thiếu ExaminationId hoặc AppointmentId.");
  }

  const appointmentResult = await pool
    .request()
    .input("AppointmentId", sql.Int, appointmentId)
    .query(`
      SELECT TOP 1 ExaminationId
      FROM Examinations
      WHERE AppointmentId = @AppointmentId
    `);

  const found = appointmentResult.recordset?.[0]?.ExaminationId;

  if (!found) {
    throw new Error("Không tìm thấy phiếu khám tương ứng với AppointmentId.");
  }

  return Number(found);
}

export async function startExaminationService(
  examinationId: number | null,
  appointmentId: number | null,
  doctorUserId?: number | null
) {
  const pool = await getDbPool();
  const resolvedExaminationId = await resolveExaminationId(pool, examinationId, appointmentId);

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, resolvedExaminationId)
    .input("DoctorUserId", sql.Int, doctorUserId ?? null)
    .execute("dbo.sp_StartExamination");

  return result.recordset?.[0] || null;
}

export async function saveDiagnosisService(
  examinationId: number,
  payload: DiagnosisPayload
) {
  const pool = await getDbPool();
  const conclusion = payload.treatment
    ? `${payload.treatment}${payload.notes ? ` | ${payload.notes}` : ""}`
    : payload.notes ?? null;

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, examinationId)
    .input("Symptoms", sql.NVarChar(1000), payload.symptoms ?? null)
    .input("Diagnosis", sql.NVarChar(1000), payload.diagnosis ?? null)
    .input("Conclusion", sql.NVarChar(1000), conclusion)
    .input("DoctorUserId", sql.Int, payload.doctorUserId ?? null)
    .execute("dbo.sp_SaveDiagnosis");

  return result.recordset?.[0] || null;
}

export async function finishExaminationService(
  examinationId: number,
  doctorUserId?: number | null
) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, examinationId)
    .input("DoctorUserId", sql.Int, doctorUserId ?? null)
    .execute("dbo.sp_FinishExamination");

  return result.recordset?.[0] || null;
}
