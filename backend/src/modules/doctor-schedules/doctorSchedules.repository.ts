import { getDbPool, sql } from "../../config/database";
import { AppError } from "../../utils/AppError";

export interface ScheduleFilters {
  doctorId?: number;
  workDate?: string;
  isActive?: boolean;
}

export interface ScheduleInput {
  doctorId: number;
  roomId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  isActive: boolean;
}

export interface ScheduleUpdateInput {
  roomId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  isActive: boolean;
}

function formatDate(value: unknown) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString().substring(0, 10);
  return String(value).substring(0, 10);
}

function formatTime(value: unknown) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString().substring(11, 19);
  return String(value).substring(0, 8);
}

function mapSchedule(item: any) {
  return {
    ...item,
    WorkDate: formatDate(item.WorkDate),
    StartTime: formatTime(item.StartTime),
    EndTime: formatTime(item.EndTime)
  };
}

export async function getSchedules(filters: ScheduleFilters) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("DoctorId", sql.Int, filters.doctorId ?? null)
    .input("WorkDate", sql.Date, filters.workDate ?? null)
    .input("IsActive", sql.Bit, filters.isActive ?? null)
    .query(`
      SELECT
        ds.ScheduleId,
        ds.DoctorId,
        u.FullName AS DoctorName,
        ds.RoomId,
        r.RoomName,
        ds.WorkDate,
        ds.StartTime,
        ds.EndTime,
        ds.MaxPatients,
        ds.IsActive,
        ds.CreatedAt,
        CAST(NULL AS DATETIME2) AS UpdatedAt
      FROM DoctorSchedules ds
      INNER JOIN Doctors d ON ds.DoctorId = d.DoctorId
      INNER JOIN Employees e ON d.EmployeeId = e.EmployeeId
      INNER JOIN Users u ON e.UserId = u.UserId
      LEFT JOIN Rooms r ON ds.RoomId = r.RoomId
      WHERE (@DoctorId IS NULL OR ds.DoctorId = @DoctorId)
        AND (@WorkDate IS NULL OR ds.WorkDate = @WorkDate)
        AND (@IsActive IS NULL OR ds.IsActive = @IsActive)
      ORDER BY ds.WorkDate DESC, ds.StartTime ASC, u.FullName ASC
    `);

  return result.recordset.map(mapSchedule);
}

export async function createSchedule(input: ScheduleInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("DoctorId", sql.Int, input.doctorId)
    .input("RoomId", sql.Int, input.roomId)
    .input("WorkDate", sql.Date, input.workDate)
    .input("StartTime", sql.VarChar(8), input.startTime)
    .input("EndTime", sql.VarChar(8), input.endTime)
    .input("MaxPatients", sql.Int, input.maxPatients)
    .input("IsActive", sql.Bit, input.isActive)
    .execute("dbo.sp_CreateDoctorSchedule");

  return mapSchedule(result.recordset[0]);
}

export async function updateSchedule(scheduleId: number, input: ScheduleUpdateInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ScheduleId", sql.Int, scheduleId)
    .input("RoomId", sql.Int, input.roomId)
    .input("WorkDate", sql.Date, input.workDate)
    .input("StartTime", sql.VarChar(8), input.startTime)
    .input("EndTime", sql.VarChar(8), input.endTime)
    .input("MaxPatients", sql.Int, input.maxPatients)
    .input("IsActive", sql.Bit, input.isActive)
    .execute("dbo.sp_UpdateDoctorSchedule");

  return mapSchedule(result.recordset[0]);
}

export async function updateScheduleStatus(scheduleId: number, isActive: boolean) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("ScheduleId", sql.Int, scheduleId)
    .input("IsActive", sql.Bit, isActive)
    .execute("dbo.sp_SetDoctorScheduleStatus");

  return mapSchedule(result.recordset[0]);
}

export function assertScheduleFound(schedule: unknown) {
  if (!schedule) {
    throw new AppError("Lich lam viec khong ton tai.", 404);
  }
}
