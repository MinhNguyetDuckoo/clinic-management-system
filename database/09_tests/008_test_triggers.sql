USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO


/* =========================================================
   1. Test trigger audit update bệnh nhân
   ========================================================= */
UPDATE Patients
SET FullName = N'Lý Văn Test Updated Trigger'
WHERE PatientCode = 'PAT003';

SELECT TOP 5
    AuditLogId,
    Action,
    TableName,
    RecordId,
    OldData,
    NewData,
    CreatedAt
FROM AuditLogs
WHERE TableName = 'Patients'
ORDER BY AuditLogId DESC;


/* =========================================================
   2. Test trigger audit update thuốc
   Lưu ý: cập nhật +1 để test rồi -1 lại.
   ========================================================= */
UPDATE Medicines
SET StockQuantity = StockQuantity + 1
WHERE MedicineId = 1;

UPDATE Medicines
SET StockQuantity = StockQuantity - 1
WHERE MedicineId = 1;

SELECT TOP 5
    AuditLogId,
    Action,
    TableName,
    RecordId,
    OldData,
    NewData,
    CreatedAt
FROM AuditLogs
WHERE TableName = 'Medicines'
ORDER BY AuditLogId DESC;


/* =========================================================
   3. Test chặn xóa hóa đơn đã thanh toán
   Đoạn này phải lỗi nếu InvoiceId = 3 đang Paid.
   ========================================================= */
DELETE FROM Invoices
WHERE InvoiceId = 3;
GO