import { getDbPool, sql } from "../../config/database";

function getRecordsets(result: any): any[] {
  return Array.isArray(result.recordsets) ? result.recordsets : [];
}

function mapExaminationResult(result: any) {
  const recordsets = getRecordsets(result);

  return {
    examination: recordsets[0]?.[0] || null,
    serviceOrders: recordsets[1] || []
  };
}

export async function getExaminationDetail(examinationId: number) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, examinationId)
    .execute("dbo.sp_GetExaminationDetail");

  return mapExaminationResult(result);
}

export async function startExamination(
  examinationId: number,
  doctorUserId?: number | null
) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, examinationId)
    .input("DoctorUserId", sql.Int, doctorUserId ?? null)
    .execute("dbo.sp_StartExamination");

  return mapExaminationResult(result);
}

export async function saveDiagnosis(input: {
  examinationId: number;
  symptoms?: string | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  doctorUserId?: number | null;
}) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, input.examinationId)
    .input("Symptoms", sql.NVarChar(1000), input.symptoms ?? null)
    .input("Diagnosis", sql.NVarChar(1000), input.diagnosis ?? null)
    .input("Conclusion", sql.NVarChar(1000), input.conclusion ?? null)
    .input("DoctorUserId", sql.Int, input.doctorUserId ?? null)
    .execute("dbo.sp_SaveDiagnosis");

  return mapExaminationResult(result);
}

export async function createServiceOrder(input: {
  examinationId: number;
  serviceId: number;
  quantity?: number;
  doctorUserId?: number | null;
}) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, input.examinationId)
    .input("ServiceId", sql.Int, input.serviceId)
    .input("Quantity", sql.Int, input.quantity ?? 1)
    .input("DoctorUserId", sql.Int, input.doctorUserId ?? null)
    .output("NewServiceOrderId", sql.Int)
    .execute("dbo.sp_CreateServiceOrder");

  return {
    output: result.output,
    data: result.recordset?.[0] || null
  };
}

export async function completeServiceOrder(input: {
  serviceOrderId: number;
  result?: string | null;
  completedBy?: number | null;
}) {
  const pool = await getDbPool();

  const dbResult = await pool
    .request()
    .input("ServiceOrderId", sql.Int, input.serviceOrderId)
    .input("Result", sql.NVarChar(1000), input.result ?? null)
    .input("CompletedBy", sql.Int, input.completedBy ?? null)
    .execute("dbo.sp_CompleteServiceOrder");

  return dbResult.recordset?.[0] || null;
}

export async function finishExamination(
  examinationId: number,
  doctorUserId?: number | null
) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, examinationId)
    .input("DoctorUserId", sql.Int, doctorUserId ?? null)
    .execute("dbo.sp_FinishExamination");

  return mapExaminationResult(result);
}