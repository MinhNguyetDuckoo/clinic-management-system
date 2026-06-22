import { getDbPool, sql } from "../../config/database";

export async function createPrescription(input: {
  examinationId: number;
  doctorId: number;
  note?: string | null;
  createdBy?: number | null;
}) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("ExaminationId", sql.Int, input.examinationId)
    .input("DoctorId", sql.Int, input.doctorId)
    .input("Note", sql.NVarChar(1000), input.note ?? null)
    .input("CreatedBy", sql.Int, input.createdBy ?? null)
    .output("NewPrescriptionId", sql.Int)
    .execute("dbo.sp_CreatePrescription");

  return {
    output: result.output,
    data: result.recordset?.[0] || null
  };
}

export async function createPrescriptionWithDetails(
  prescriptionInput: {
    examinationId: number;
    doctorId: number;
    note?: string | null;
    createdBy?: number | null;
  },
  items: Array<{
    medicineId: number;
    quantity: number;
    dosage?: string | null;
    usageInstruction?: string | null;
  }>
) {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const existingReq = new sql.Request(transaction);
    existingReq.input("ExaminationId", sql.Int, prescriptionInput.examinationId);
    const existingResult = await existingReq.query(`
      SELECT TOP 1 PrescriptionId
      FROM Prescriptions WITH (UPDLOCK, HOLDLOCK)
      WHERE ExaminationId = @ExaminationId
        AND Status = 'Pending'
      ORDER BY CreatedAt DESC, PrescriptionId DESC
    `);

    let prescriptionId = existingResult.recordset?.[0]?.PrescriptionId;

    if (!prescriptionId) {
      const req1 = new sql.Request(transaction);
      req1.input("ExaminationId", sql.Int, prescriptionInput.examinationId);
      req1.input("DoctorId", sql.Int, prescriptionInput.doctorId);
      req1.input("Note", sql.NVarChar(1000), prescriptionInput.note ?? null);
      req1.input("CreatedBy", sql.Int, prescriptionInput.createdBy ?? null);
      req1.output("NewPrescriptionId", sql.Int);

      const result1 = await req1.execute("dbo.sp_CreatePrescription");
      prescriptionId = result1.output.NewPrescriptionId;
    }
    
    if (!prescriptionId) {
      throw new Error("Không thể tạo đơn thuốc chính.");
    }

    // 2. Add details
    for (const item of items) {
      const req2 = new sql.Request(transaction);
      req2.input("PrescriptionId", sql.Int, prescriptionId);
      req2.input("MedicineId", sql.Int, item.medicineId);
      req2.input("Quantity", sql.Int, item.quantity);
      req2.input("Dosage", sql.NVarChar(255), item.dosage ?? null);
      req2.input("UsageInstruction", sql.NVarChar(500), item.usageInstruction ?? null);
      req2.input("CreatedBy", sql.Int, prescriptionInput.createdBy ?? null);
      req2.output("NewPrescriptionDetailId", sql.Int);
      
      await req2.execute("dbo.sp_AddPrescriptionDetail");
    }

    await transaction.commit();
    return { prescriptionId };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // Transaction may already be rolled back by SQL Server after an error.
    }

    throw err;
  }
}

export async function addPrescriptionDetail(input: {
  prescriptionId: number;
  medicineId: number;
  quantity: number;
  dosage?: string | null;
  usageInstruction?: string | null;
  createdBy?: number | null;
}) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PrescriptionId", sql.Int, input.prescriptionId)
    .input("MedicineId", sql.Int, input.medicineId)
    .input("Quantity", sql.Int, input.quantity)
    .input("Dosage", sql.NVarChar(255), input.dosage ?? null)
    .input("UsageInstruction", sql.NVarChar(500), input.usageInstruction ?? null)
    .input("CreatedBy", sql.Int, input.createdBy ?? null)
    .output("NewPrescriptionDetailId", sql.Int)
    .execute("dbo.sp_AddPrescriptionDetail");

  return {
    output: result.output,
    data: result.recordset?.[0] || null
  };
}

export async function getPrescriptionDetail(prescriptionId: number) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PrescriptionId", sql.Int, prescriptionId)
    .execute("dbo.sp_GetPrescriptionDetail");

  const recordsets = Array.isArray(result.recordsets) ? result.recordsets : [];

  return {
    prescription: recordsets[0]?.[0] || null,
    medicines: recordsets[1] || []
  };
}

export async function deletePrescriptionDetail(input: {
  prescriptionDetailId: number;
  deletedBy?: number | null;
}) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PrescriptionDetailId", sql.Int, input.prescriptionDetailId)
    .input("DeletedBy", sql.Int, input.deletedBy ?? null)
    .execute("dbo.sp_DeletePrescriptionDetail");

  return result.recordset?.[0] || null;
}

export async function getPrescriptionByExaminationId(examinationId: number) {
  const pool = await getDbPool();

  const prescriptionResult = await pool
    .request()
    .input("ExaminationId", sql.Int, examinationId)
    .query(`
      SELECT TOP 1 PrescriptionId
      FROM Prescriptions
      WHERE ExaminationId = @ExaminationId
        AND Status <> 'Cancelled'
      ORDER BY CreatedAt DESC, PrescriptionId DESC
    `);

  const prescriptionId = prescriptionResult.recordset?.[0]?.PrescriptionId;

  if (!prescriptionId) {
    return {
      prescription: null,
      medicines: []
    };
  }

  return getPrescriptionDetail(Number(prescriptionId));
}

export async function getPendingPrescriptions() {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .execute("dbo.sp_GetPendingPrescriptions");

  return result.recordset;
}

export async function dispenseMedicine(input: {
  prescriptionId: number;
  dispensedBy: number;
}) {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("PrescriptionId", sql.Int, input.prescriptionId)
    .input("DispensedBy", sql.Int, input.dispensedBy)
    .execute("dbo.sp_DispenseMedicine");

  const recordsets = Array.isArray(result.recordsets) ? result.recordsets : [];

  return {
    prescription: recordsets[0]?.[0] || null,
    medicines: recordsets[1] || []
  };
}
