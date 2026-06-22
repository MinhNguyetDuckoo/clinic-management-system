import { getDbPool, sql } from "../../config/database";

export interface CreatePatientInput {
  userId?: number | null;
  fullName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  healthInsuranceNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdBy?: number | null;
}

export interface UpdatePatientInput {
  patientId: number;
  fullName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  healthInsuranceNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  updatedBy?: number | null;
}

export async function searchPatients(keyword?: string) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("Keyword", sql.NVarChar(150), keyword || null)
    .execute("dbo.sp_SearchPatients");

  return result.recordset;
}

export async function getPatientById(patientId: number) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PatientId", sql.Int, patientId)
    .execute("dbo.sp_GetPatientById");

  return result.recordset[0] || null;
}

export async function createPatient(input: CreatePatientInput) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("UserId", sql.Int, input.userId ?? null)
    .input("FullName", sql.NVarChar(150), input.fullName)
    .input("Gender", sql.NVarChar(10), input.gender ?? null)
    .input("DateOfBirth", sql.Date, input.dateOfBirth ?? null)
    .input("Phone", sql.NVarChar(20), input.phone ?? null)
    .input("Email", sql.NVarChar(150), input.email ?? null)
    .input("Address", sql.NVarChar(255), input.address ?? null)
    .input("HealthInsuranceNumber", sql.NVarChar(50), input.healthInsuranceNumber ?? null)
    .input("EmergencyContactName", sql.NVarChar(150), input.emergencyContactName ?? null)
    .input("EmergencyContactPhone", sql.NVarChar(20), input.emergencyContactPhone ?? null)
    .input("CreatedBy", sql.Int, input.createdBy ?? null)
    .output("NewPatientId", sql.Int)
    .output("NewMedicalRecordId", sql.Int)
    .execute("dbo.sp_CreatePatient");

  return {
    output: result.output,
    data: result.recordset?.[0] || null
  };
}

export async function updatePatient(input: UpdatePatientInput) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PatientId", sql.Int, input.patientId)
    .input("FullName", sql.NVarChar(150), input.fullName)
    .input("Gender", sql.NVarChar(10), input.gender ?? null)
    .input("DateOfBirth", sql.Date, input.dateOfBirth ?? null)
    .input("Phone", sql.NVarChar(20), input.phone ?? null)
    .input("Email", sql.NVarChar(150), input.email ?? null)
    .input("Address", sql.NVarChar(255), input.address ?? null)
    .input("HealthInsuranceNumber", sql.NVarChar(50), input.healthInsuranceNumber ?? null)
    .input("EmergencyContactName", sql.NVarChar(150), input.emergencyContactName ?? null)
    .input("EmergencyContactPhone", sql.NVarChar(20), input.emergencyContactPhone ?? null)
    .input("UpdatedBy", sql.Int, input.updatedBy ?? null)
    .execute("dbo.sp_UpdatePatient");

  return result.recordset[0] || null;
}