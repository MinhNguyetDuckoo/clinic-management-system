import * as examinationRepo from "./examinations.repository";

export async function getExaminationDetail(examinationId: number) {
  if (!examinationId) {
    throw new Error("ExaminationId không hợp lệ.");
  }

  const data = await examinationRepo.getExaminationDetail(examinationId);

  if (!data.examination) {
    throw new Error("Không tìm thấy phiếu khám.");
  }

  return data;
}

export async function startExamination(examinationId: number, currentUserId?: number) {
  if (!examinationId) {
    throw new Error("ExaminationId không hợp lệ.");
  }

  return examinationRepo.startExamination(examinationId, currentUserId ?? null);
}

export async function saveDiagnosis(examinationId: number, body: any, currentUserId?: number) {
  if (!examinationId) {
    throw new Error("ExaminationId không hợp lệ.");
  }

  return examinationRepo.saveDiagnosis({
    examinationId,
    symptoms: body.symptoms ?? null,
    diagnosis: body.diagnosis ?? null,
    conclusion: body.conclusion ?? null,
    doctorUserId: currentUserId ?? null
  });
}

export async function createServiceOrder(examinationId: number, body: any, currentUserId?: number) {
  if (!examinationId) {
    throw new Error("ExaminationId không hợp lệ.");
  }

  if (!body.serviceId) {
    throw new Error("ServiceId là bắt buộc.");
  }

  return examinationRepo.createServiceOrder({
    examinationId,
    serviceId: Number(body.serviceId),
    quantity: body.quantity ? Number(body.quantity) : 1,
    doctorUserId: currentUserId ?? null
  });
}

export async function completeServiceOrder(serviceOrderId: number, body: any, currentUserId?: number) {
  if (!serviceOrderId) {
    throw new Error("ServiceOrderId không hợp lệ.");
  }

  return examinationRepo.completeServiceOrder({
    serviceOrderId,
    result: body.result ?? null,
    completedBy: currentUserId ?? null
  });
}

export async function finishExamination(examinationId: number, currentUserId?: number) {
  if (!examinationId) {
    throw new Error("ExaminationId không hợp lệ.");
  }

  return examinationRepo.finishExamination(examinationId, currentUserId ?? null);
}