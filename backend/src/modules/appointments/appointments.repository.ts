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

export async function countAppointmentsPhantom(date: string) {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

  try {
    const r1 = await transaction.request()
      .input("AppointmentDate", sql.Date, date)
      .query(`SELECT COUNT(*) as Count1 FROM Appointments WHERE AppointmentDate = @AppointmentDate`);
    const count1 = r1.recordset[0].Count1;

    await new Promise(resolve => setTimeout(resolve, 10000));

    const r2 = await transaction.request()
      .input("AppointmentDate", sql.Date, date)
      .query(`SELECT COUNT(*) as Count2 FROM Appointments WHERE AppointmentDate = @AppointmentDate`);
    const count2 = r2.recordset[0].Count2;

    await transaction.commit();
    return { count1, count2 };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function createAppointmentFast(date: string) {
  const pool = await getDbPool();

  const result = await pool.request()
    .input("AppointmentDate", sql.Date, date)
    .query(`
      DECLARE @PatientId INT = (SELECT TOP 1 PatientId FROM Patients WHERE IsDeleted = 0 ORDER BY NEWID());
      DECLARE @DoctorId INT = (SELECT TOP 1 DoctorId FROM Doctors WHERE IsActive = 1 ORDER BY NEWID());
      
      INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, AppointmentTime, Status, CreatedAt)
      OUTPUT INSERTED.AppointmentId
      VALUES (@PatientId, @DoctorId, @AppointmentDate, '10:00', 'Scheduled', SYSDATETIME());
    `);
    
  return result.recordset[0];
}
