import { getDbPool, sql } from "../../config/database";

export interface CreateAppointmentInput {
  patientId: number;
  doctorId: number;
  roomId?: number | null;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string | null;
  createdBy?: number | null;
}

export async function getAppointmentsByDate(date: string) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("AppointmentDate", sql.Date, date)
    .execute("dbo.sp_GetAppointmentsByDate");

  return result.recordset.map((item) => ({
    ...item,
    AppointmentTime:
      item.AppointmentTime instanceof Date
        ? item.AppointmentTime.toISOString().substring(11, 19)
        : String(item.AppointmentTime).substring(0, 8)
  }));
}

export async function createAppointment(input: CreateAppointmentInput) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PatientId", sql.Int, input.patientId)
    .input("DoctorId", sql.Int, input.doctorId)
    .input("RoomId", sql.Int, input.roomId ?? null)
    .input("AppointmentDate", sql.Date, input.appointmentDate)
    .input("AppointmentTime", sql.VarChar(8), input.appointmentTime)
    .input("Reason", sql.NVarChar(500), input.reason ?? null)
    .input("CreatedBy", sql.Int, input.createdBy ?? null)
    .output("NewAppointmentId", sql.Int)
    .execute("dbo.sp_CreateAppointment");

  return {
    output: result.output,
    data: result.recordset?.[0] || null
  };
}

export async function checkInPatient(appointmentId: number, checkedInBy?: number | null) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("AppointmentId", sql.Int, appointmentId)
    .input("CheckedInBy", sql.Int, checkedInBy ?? null)
    .output("NewExaminationId", sql.Int)
    .execute("dbo.sp_CheckInPatient");

  return {
    output: result.output,
    data: result.recordset?.[0] || null
  };
}

export async function cancelAppointment(
  appointmentId: number,
  cancelledBy?: number | null,
  cancelReason?: string | null
) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("AppointmentId", sql.Int, appointmentId)
    .input("CancelledBy", sql.Int, cancelledBy ?? null)
    .input("CancelReason", sql.NVarChar(500), cancelReason ?? null)
    .execute("dbo.sp_CancelAppointment");

  return result.recordset?.[0] || null;
}
