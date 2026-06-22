import * as patientRepo from "./patients.repository";

const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function validatePhone(value: unknown, fieldName: string) {
  const normalized = normalizeOptionalString(value);

  if (typeof normalized === "string" && !PHONE_PATTERN.test(normalized)) {
    throw new Error(`${fieldName} không hợp lệ.`);
  }

  return normalized as string | null;
}

export async function searchPatients(keyword?: string) {
  const patients = await patientRepo.searchPatients(keyword);
  const uniquePatients = new Map<number, any>();

  for (const patient of patients) {
    if (!uniquePatients.has(patient.PatientId)) {
      uniquePatients.set(patient.PatientId, patient);
    }
  }

  return Array.from(uniquePatients.values());
}

export async function getPatientById(patientId: number) {
  const patient = await patientRepo.getPatientById(patientId);

  if (!patient) {
    throw new Error("Không tìm thấy bệnh nhân.");
  }

  return patient;
}

export async function createPatient(body: any, currentUserId?: number) {
  if (!body.fullName?.trim()) {
    throw new Error("Họ tên bệnh nhân là bắt buộc.");
  }

  const phone = validatePhone(body.phone, "Số điện thoại");
  const emergencyContactPhone = validatePhone(
    body.emergencyContactPhone,
    "SĐT khẩn cấp"
  );

  return patientRepo.createPatient({
    userId: body.userId ?? null,
    fullName: body.fullName.trim(),
    gender: normalizeOptionalString(body.gender),
    dateOfBirth: body.dateOfBirth ?? null,
    phone,
    email: normalizeOptionalString(body.email),
    address: normalizeOptionalString(body.address),
    healthInsuranceNumber: normalizeOptionalString(body.healthInsuranceNumber),
    emergencyContactName: normalizeOptionalString(body.emergencyContactName),
    emergencyContactPhone,
    createdBy: currentUserId ?? null,
  });
}

export async function updatePatient(
  patientId: number,
  body: any,
  currentUserId?: number
) {
  if (!body.fullName?.trim()) {
    throw new Error("Họ tên bệnh nhân là bắt buộc.");
  }

  const phone = validatePhone(body.phone, "Số điện thoại");
  const emergencyContactPhone = validatePhone(
    body.emergencyContactPhone,
    "SĐT khẩn cấp"
  );

  return patientRepo.updatePatient({
    patientId,
    fullName: body.fullName.trim(),
    gender: normalizeOptionalString(body.gender),
    dateOfBirth: body.dateOfBirth ?? null,
    phone,
    email: normalizeOptionalString(body.email),
    address: normalizeOptionalString(body.address),
    healthInsuranceNumber: normalizeOptionalString(body.healthInsuranceNumber),
    emergencyContactName: normalizeOptionalString(body.emergencyContactName),
    emergencyContactPhone,
    updatedBy: currentUserId ?? null,
  });
}
