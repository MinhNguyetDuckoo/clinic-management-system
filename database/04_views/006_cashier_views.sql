USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_Cashier_UnpaidInvoices
AS
SELECT
    i.InvoiceId,
    i.PatientId,
    p.PatientCode,
    p.FullName AS PatientName,
    p.Phone AS PatientPhone,

    i.ExaminationId,
    i.TotalAmount,
    i.Status,
    i.CreatedAt,

    COUNT(id.InvoiceDetailId) AS TotalItems
FROM Invoices i
INNER JOIN Patients p 
    ON i.PatientId = p.PatientId
LEFT JOIN InvoiceDetails id 
    ON i.InvoiceId = id.InvoiceId
WHERE i.Status = 'Unpaid'
  AND NOT EXISTS (
      SELECT 1
      FROM Prescriptions pr
      WHERE pr.ExaminationId = i.ExaminationId
        AND pr.Status = 'Pending'
  )
GROUP BY
    i.InvoiceId,
    i.PatientId,
    p.PatientCode,
    p.FullName,
    p.Phone,
    i.ExaminationId,
    i.TotalAmount,
    i.Status,
    i.CreatedAt;
GO
