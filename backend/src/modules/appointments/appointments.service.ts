import * as appointmentRepo from "./appointments.repository";

function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function currentTimeString(): string {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}:00`;
}

function normalizeTime(time: string): string {
  if (!time) {
    throw new Error("Giờ hẹn là bắt buộc.");
  }

  const parts = time.split(":");

  if (parts.length < 2 || parts.length > 3) {
    throw new Error("Giờ hẹn không hợp lệ. Định dạng đúng: HH:mm hoặc HH:mm:ss.");
  }

  const hour = parts[0].padStart(2, "0");
  const minute = parts[1].padStart(2, "0");
  const second = parts[2] ? parts[2].padStart(2, "0") : "00";

  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  const secondNumber = Number(second);

  if (
    !Number.isInteger(hourNumber) ||
    !Number.isInteger(minuteNumber) ||
    !Number.isInteger(secondNumber) ||
    hourNumber < 0 ||
    hourNumber > 23 ||
    minuteNumber < 0 ||
    minuteNumber > 59 ||
    secondNumber < 0 ||
    secondNumber > 59
  ) {
    throw new Error("Giá» háº¹n khÃ´ng há»£p lá»‡.");
  }

  return `${hour}:${minute}:${second}`;
}

function validateAppointmentDateTime(appointmentDate: string, appointmentTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    throw new Error("NgÃ y háº¹n khÃ´ng há»£p lá»‡. Äá»‹nh dáº¡ng Ä‘Ãºng: YYYY-MM-DD.");
  }

  const [year, month, day] = appointmentDate.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    throw new Error("Ngày hẹn không hợp lệ.");
  }

  const today = todayString();

  if (
    appointmentDate < today ||
    (appointmentDate === today && appointmentTime < currentTimeString())
  ) {
    throw new Error("KhÃ´ng thá»ƒ táº¡o lá»‹ch háº¹n á»Ÿ thá»i gian trong quÃ¡ khá»©.");
  }
}

export async function getAppointmentsByDate(date?: string) {
  if (!date) {
    throw new Error("Vui lòng truyền ngày cần xem lịch.");
  }

  return appointmentRepo.getAppointmentsByDate(date);
}

export async function createAppointment(body: any, currentUserId?: number) {
  if (!body.patientId) {
    throw new Error("PatientId là bắt buộc.");
  }

  if (!body.doctorId) {
    throw new Error("DoctorId là bắt buộc.");
  }

  if (!body.appointmentDate) {
    throw new Error("Ngày hẹn là bắt buộc.");
  }

  if (!body.appointmentTime) {
    throw new Error("Giờ hẹn là bắt buộc.");
  }

  const appointmentTime = normalizeTime(body.appointmentTime);
  validateAppointmentDateTime(body.appointmentDate, appointmentTime);

  return appointmentRepo.createAppointment({
    patientId: Number(body.patientId),
    doctorId: Number(body.doctorId),
    roomId: body.roomId ? Number(body.roomId) : null,
    appointmentDate: body.appointmentDate,
    appointmentTime,
    reason: body.reason ?? null,
    createdBy: currentUserId ?? null
  });
}

export async function checkInPatient(appointmentId: number, currentUserId?: number) {
  if (!appointmentId) {
    throw new Error("AppointmentId không hợp lệ.");
  }

  return appointmentRepo.checkInPatient(appointmentId, currentUserId ?? null);
}

export async function cancelAppointment(
  appointmentId: number,
  body: any,
  currentUserId?: number
) {
  if (!appointmentId) {
    throw new Error("AppointmentId không hợp lệ.");
  }

  return appointmentRepo.cancelAppointment(
    appointmentId,
    currentUserId ?? null,
    body.cancelReason ?? null
  );
}

export async function countAppointmentsPhantom(date: string) {
  return await appointmentRepo.countAppointmentsPhantom(date);
}

export async function createAppointmentFast(date: string) {
  return await appointmentRepo.createAppointmentFast(date);
}
