import { getDbPool } from "../../config/database";
import sql from "mssql";

export async function getUnpaidInvoices() {
  const pool = await getDbPool();
  const result = await pool.request().execute("sp_GetUnpaidInvoices");
  return result.recordset;
}

export type InvoiceListFilters = {
  status?: string | null;
  patientKeyword?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export async function getInvoices(filters: InvoiceListFilters) {
  const pool = await getDbPool();
  const request = pool.request();

  request.input("Status", sql.NVarChar(50), filters.status || "All");
  request.input("PatientKeyword", sql.NVarChar(100), filters.patientKeyword || null);
  request.input("DateFrom", sql.Date, filters.dateFrom || null);
  request.input("DateTo", sql.Date, filters.dateTo || null);

  const result = await request.execute("sp_GetInvoices");
  return result.recordset;
}

export async function getReadyForInvoiceExaminations() {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT
      pr.PrescriptionId,
      pr.ExaminationId,
      pr.Status AS PrescriptionStatus,
      pr.CreatedAt AS PrescriptionCreatedAt,
      pr.DispensedAt,
      p.PatientId,
      p.PatientCode,
      p.FullName AS PatientName,
      p.Phone AS PatientPhone,
      d.DoctorId,
      du.FullName AS DoctorName,
      COUNT(pd.PrescriptionDetailId) AS TotalMedicineItems,
      SUM(CAST(pd.Quantity AS DECIMAL(18, 2)) * ISNULL(m.Price, 0)) AS MedicineAmount
    FROM Prescriptions pr
    INNER JOIN Examinations ex
      ON pr.ExaminationId = ex.ExaminationId
    INNER JOIN Appointments a
      ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p
      ON a.PatientId = p.PatientId
    INNER JOIN Doctors d
      ON pr.DoctorId = d.DoctorId
    INNER JOIN Employees de
      ON d.EmployeeId = de.EmployeeId
    INNER JOIN Users du
      ON de.UserId = du.UserId
    LEFT JOIN PrescriptionDetails pd
      ON pr.PrescriptionId = pd.PrescriptionId
    LEFT JOIN Medicines m
      ON pd.MedicineId = m.MedicineId
    WHERE pr.Status = 'Dispensed'
      AND NOT EXISTS (
        SELECT 1
        FROM Invoices i
        WHERE i.ExaminationId = pr.ExaminationId
          AND i.Status <> 'Cancelled'
      )
    GROUP BY
      pr.PrescriptionId,
      pr.ExaminationId,
      pr.Status,
      pr.CreatedAt,
      pr.DispensedAt,
      p.PatientId,
      p.PatientCode,
      p.FullName,
      p.Phone,
      d.DoctorId,
      du.FullName
    ORDER BY pr.DispensedAt DESC, pr.CreatedAt DESC, pr.PrescriptionId DESC;
  `);

  return result.recordset;
}

export async function getInvoiceDetail(invoiceId: number) {
  const pool = await getDbPool();
  const request = pool.request();
  request.input("InvoiceId", sql.Int, invoiceId);
  const result = await request.execute("sp_GetInvoiceDetail");
  const recordsets = result.recordsets as sql.IRecordSet<any>[];
  
  return {
    invoice: recordsets[0]?.[0] || null,
    details: recordsets[1] || [],
    payments: recordsets[2] || []
  };
}

export async function createInvoiceFromExamination(examinationId: number, createdBy: number | null) {
  const pool = await getDbPool();
  const request = pool.request();
  request.input("ExaminationId", sql.Int, examinationId);
  if (createdBy !== null) {
    request.input("CreatedBy", sql.Int, createdBy);
  }
  request.output("NewInvoiceId", sql.Int);
  
  const result = await request.execute("sp_CreateInvoiceFromExamination");
  return result.output.NewInvoiceId;
}

export async function payInvoice(
  invoiceId: number, 
  amount: number, 
  paymentMethod: string, 
  paidBy: number | null, 
  note: string | null
) {
  const pool = await getDbPool();
  const request = pool.request();
  request.input("InvoiceId", sql.Int, invoiceId);
  request.input("Amount", sql.Decimal(18, 2), amount);
  request.input("PaymentMethod", sql.NVarChar(50), paymentMethod);
  if (paidBy !== null) {
    request.input("PaidBy", sql.Int, paidBy);
  }
  if (note !== null) {
    request.input("Note", sql.NVarChar(255), note);
  }
  request.output("NewPaymentId", sql.Int);
  
  const result = await request.execute("sp_PayInvoice");
  return result.output.NewPaymentId;
}

export async function cancelInvoice(invoiceId: number, cancelledBy: number | null, reason: string | null) {
  const pool = await getDbPool();
  const request = pool.request();
  request.input("InvoiceId", sql.Int, invoiceId);
  if (cancelledBy !== null) {
    request.input("CancelledBy", sql.Int, cancelledBy);
  }
  if (reason !== null) {
    request.input("Reason", sql.NVarChar(255), reason);
  }
  
  const result = await request.execute("sp_CancelInvoice");
  return result.recordset[0];
}

export async function payInvoiceError(input: {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paidBy: number;
  note?: string;
}) {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    await transaction.request()
      .input("InvoiceId", sql.Int, input.invoiceId)
      .query(`
        UPDATE Invoices 
        SET Status = 'Paid' 
        WHERE InvoiceId = @InvoiceId
      `);

    await transaction.request()
      .input("InvoiceId", sql.Int, input.invoiceId)
      .input("Amount", sql.Decimal(18, 2), input.amount)
      .input("PaymentMethod", sql.NVarChar(50), input.paymentMethod)
      .input("PaidBy", sql.Int, input.paidBy)
      .input("Note", sql.NVarChar(255), input.note || null)
      .query(`
        INSERT INTO Payments (InvoiceId, Amount, PaymentMethod, PaidBy, Note, PaidAt)
        VALUES (@InvoiceId, @Amount, @PaymentMethod, @PaidBy, @Note, SYSDATETIME())
      `);

    await new Promise(resolve => setTimeout(resolve, 10000));

    throw new Error("Giao dịch thanh toán gặp sự cố mạng (Rollback).");
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function createSampleInvoice() {
  const pool = await getDbPool();

  const result = await pool.request().query(`
    DECLARE @PatientId INT = (SELECT TOP 1 PatientId FROM Patients WHERE IsDeleted = 0 ORDER BY NEWID());
    DECLARE @CreatedBy INT = 5; 
    
    INSERT INTO Invoices (PatientId, ExaminationId, TotalAmount, Status, CreatedBy, CreatedAt)
    OUTPUT INSERTED.InvoiceId
    VALUES (@PatientId, NULL, 500000, 'Unpaid', @CreatedBy, SYSDATETIME());
    
    DECLARE @NewInvoiceId INT = (SELECT TOP 1 InvoiceId FROM Invoices ORDER BY InvoiceId DESC);
    
    INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
    VALUES 
      (@NewInvoiceId, 'Service', 1, N'Khám bệnh chuyên khoa', 1, 200000),
      (@NewInvoiceId, 'Medicine', 1, N'Thuốc mẫu', 5, 60000);
      
    SELECT @NewInvoiceId as InvoiceId;
  `);

  return result.recordset?.[0] || null;
}
