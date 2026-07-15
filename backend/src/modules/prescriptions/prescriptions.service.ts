import * as prescriptionRepo from "./prescriptions.repository";

export async function createPrescription(body: any, currentUserId?: number) {
  if (!body.examinationId) {
    throw new Error("ExaminationId là bắt buộc.");
  }

  if (!body.doctorId) {
    throw new Error("DoctorId là bắt buộc.");
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw new Error("Đơn thuốc phải có ít nhất một loại thuốc.");
  }

  const items = body.items.map((item: any) => {
    const medicineId = Number(item.medicineId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(medicineId) || medicineId <= 0) {
      throw new Error("MedicineId không hợp lệ.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Số lượng thuốc phải là số nguyên lớn hơn 0.");
    }

    // Build usage instruction string from frequency, duration, instruction
    const usageParts = [];
    if (item.frequency) usageParts.push(`Tần suất: ${item.frequency}`);
    if (item.duration) usageParts.push(`Thời gian: ${item.duration}`);
    if (item.instruction) usageParts.push(`HD: ${item.instruction}`);
    
    const usageInstruction = usageParts.length > 0 ? usageParts.join(". ") : null;

    return {
      medicineId,
      quantity,
      dosage: item.dosage ?? null,
      usageInstruction
    };
  });

  return prescriptionRepo.createPrescriptionWithDetails(
    {
      examinationId: Number(body.examinationId),
      doctorId: Number(body.doctorId),
      note: body.note ?? null,
      createdBy: currentUserId ?? null
    },
    items
  );
}

export async function addPrescriptionDetail(
  prescriptionId: number,
  body: any,
  currentUserId?: number
) {
  if (!prescriptionId) {
    throw new Error("PrescriptionId không hợp lệ.");
  }

  if (!body.medicineId) {
    throw new Error("MedicineId là bắt buộc.");
  }

  if (!body.quantity || Number(body.quantity) <= 0) {
    throw new Error("Số lượng thuốc phải lớn hơn 0.");
  }

  return prescriptionRepo.addPrescriptionDetail({
    prescriptionId,
    medicineId: Number(body.medicineId),
    quantity: Number(body.quantity),
    dosage: body.dosage ?? null,
    usageInstruction: body.usageInstruction ?? null,
    createdBy: currentUserId ?? null
  });
}

export async function deletePrescriptionDetail(
  prescriptionDetailId: number,
  currentUserId?: number
) {
  if (!prescriptionDetailId) {
    throw new Error("PrescriptionDetailId không hợp lệ.");
  }

  return prescriptionRepo.deletePrescriptionDetail({
    prescriptionDetailId,
    deletedBy: currentUserId ?? null
  });
}

export async function getPrescriptionDetail(prescriptionId: number) {
  if (!prescriptionId) {
    throw new Error("PrescriptionId không hợp lệ.");
  }

  const data = await prescriptionRepo.getPrescriptionDetail(prescriptionId);

  if (!data.prescription) {
    throw new Error("Không tìm thấy đơn thuốc.");
  }

  return data;
}

export async function getPendingPrescriptions() {
  return prescriptionRepo.getPendingPrescriptions();
}

export async function dispenseMedicine(prescriptionId: number, currentUserId?: number) {
  if (!prescriptionId) {
    throw new Error("PrescriptionId không hợp lệ.");
  }

  if (!currentUserId) {
    throw new Error("Không xác định được người cấp thuốc.");
  }

  return prescriptionRepo.dispenseMedicine({
    prescriptionId,
    dispensedBy: currentUserId
  });
}

export async function getPrescriptionByExaminationId(examinationId: number) {
  if (!examinationId) {
    throw new Error("ExaminationId không hợp lệ.");
  }

  return prescriptionRepo.getPrescriptionByExaminationId(examinationId);
}

export async function dispenseMedicineDelay(prescriptionId: number, currentUserId?: number) {
  if (!prescriptionId) {
    throw new Error("PrescriptionId không hợp lệ.");
  }

  if (!currentUserId) {
    throw new Error("Không xác định được người cấp thuốc.");
  }

  return prescriptionRepo.dispenseMedicineDelay({
    prescriptionId,
    dispensedBy: currentUserId
  });
}

export async function createSampleData() {
  return prescriptionRepo.createSampleData();
}

export async function dispenseMedicineLostUpdate(prescriptionId: number, currentUserId?: number) {
  if (!prescriptionId) {
    throw new Error("PrescriptionId không hợp lệ.");
  }

  if (!currentUserId) {
    throw new Error("Không xác định được người cấp thuốc.");
  }

  return prescriptionRepo.dispenseMedicineLostUpdate({
    prescriptionId,
    dispensedBy: currentUserId
  });
}
