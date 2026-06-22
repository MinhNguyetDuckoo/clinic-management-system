import { AppError } from "../../utils/AppError";
import * as repo from "./doctorSchedules.repository";

function asPositiveInt(value: unknown, field: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new AppError(`${field} phai la so nguyen duong.`);
  }
  return numberValue;
}

function asRequiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} la bat buoc.`);
  }
  return value.trim();
}

function normalizeTime(value: unknown, field: string) {
  const raw = asRequiredString(value, field);
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) {
    throw new AppError(`${field} khong hop le.`);
  }
  return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
}

function normalizeDate(value: unknown, field: string) {
  const raw = asRequiredString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError(`${field} khong hop le.`);
  }
  return raw;
}

function normalizeBoolean(value: unknown, defaultValue = true) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AppError("isActive khong hop le.");
}

function validateScheduleInput(body: any, requireDoctor: boolean) {
  const startTime = normalizeTime(body.startTime, "startTime");
  const endTime = normalizeTime(body.endTime, "endTime");

  if (startTime >= endTime) {
    throw new AppError("Gio bat dau phai nho hon gio ket thuc.");
  }

  const base = {
    roomId: asPositiveInt(body.roomId, "roomId"),
    workDate: normalizeDate(body.workDate, "workDate"),
    startTime,
    endTime,
    maxPatients: asPositiveInt(body.maxPatients, "maxPatients"),
    isActive: normalizeBoolean(body.isActive, true)
  };

  if (!requireDoctor) return base;

  return {
    doctorId: asPositiveInt(body.doctorId, "doctorId"),
    ...base
  };
}

export async function getSchedules(query: any) {
  return repo.getSchedules({
    doctorId: query.doctorId ? asPositiveInt(query.doctorId, "doctorId") : undefined,
    workDate: query.workDate ? normalizeDate(query.workDate, "workDate") : undefined,
    isActive:
      query.isActive === undefined ? undefined : normalizeBoolean(query.isActive, true)
  });
}

export async function createSchedule(body: any) {
  const input = validateScheduleInput(body, true);
  if (!("doctorId" in input)) {
    throw new AppError("doctorId la bat buoc.");
  }
  return repo.createSchedule(input);
}

export async function updateSchedule(scheduleId: number, body: any) {
  const schedule = await repo.updateSchedule(
    asPositiveInt(scheduleId, "scheduleId"),
    validateScheduleInput(body, false)
  );
  repo.assertScheduleFound(schedule);
  return schedule;
}

export async function updateScheduleStatus(scheduleId: number, body: any) {
  const schedule = await repo.updateScheduleStatus(
    asPositiveInt(scheduleId, "scheduleId"),
    normalizeBoolean(body.isActive, true)
  );
  repo.assertScheduleFound(schedule);
  return schedule;
}
