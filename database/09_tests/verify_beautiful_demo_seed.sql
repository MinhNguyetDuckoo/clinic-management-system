USE ClinicManagementDB;
GO

/* =========================================================
   Verify beautiful demo seed
   - Không sửa dữ liệu
   - Trả về các bảng kiểm tra để chụp báo cáo / rà soát lỗi
   ========================================================= */

PRINT '1) Demo data counts';

SELECT 'Users @cliniccare.demo' AS CheckName, COUNT(*) AS TotalRows
FROM Users
WHERE Email LIKE '%@cliniccare.demo'
UNION ALL
SELECT 'Doctors DEMO-BEAUTY', COUNT(*)
FROM Doctors
WHERE LicenseNumber LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'Patients DEMO-BEAUTY', COUNT(*)
FROM Patients
WHERE PatientCode LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'MedicalRecords DEMO-BEAUTY', COUNT(*)
FROM MedicalRecords
WHERE RecordCode LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'DoctorSchedules DEMO doctors', COUNT(*)
FROM DoctorSchedules ds
INNER JOIN Doctors d ON ds.DoctorId = d.DoctorId
WHERE d.LicenseNumber LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'Appointments DEMO patients', COUNT(*)
FROM Appointments a
INNER JOIN Patients p ON a.PatientId = p.PatientId
WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'Examinations DEMO patients', COUNT(*)
FROM Examinations ex
INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
INNER JOIN Patients p ON a.PatientId = p.PatientId
WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'Prescriptions DEMO patients', COUNT(*)
FROM Prescriptions pr
INNER JOIN Examinations ex ON pr.ExaminationId = ex.ExaminationId
INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
INNER JOIN Patients p ON a.PatientId = p.PatientId
WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'Invoices DEMO patients', COUNT(*)
FROM Invoices i
INNER JOIN Patients p ON i.PatientId = p.PatientId
WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
UNION ALL
SELECT 'Payments DEMO paid by cashier', COUNT(*)
FROM Payments pay
INNER JOIN Users u ON pay.PaidBy = u.UserId
WHERE u.Email LIKE '%@cliniccare.demo';
GO

PRINT '2) Demo workflow snapshot';

SELECT
    p.PatientCode,
    p.FullName AS PatientName,
    a.AppointmentDate,
    CONVERT(VARCHAR(5), a.AppointmentTime, 108) AS AppointmentTime,
    a.Status AS AppointmentStatus,
    du.FullName AS DoctorName,
    s.SpecialtyName,
    r.RoomName,
    ex.ExaminationId,
    ex.Status AS ExaminationStatus,
    pr.PrescriptionId,
    pr.Status AS PrescriptionStatus,
    i.InvoiceId,
    i.Status AS InvoiceStatus,
    i.TotalAmount,
    pay.PaymentMethod,
    pay.PaidAt
FROM Patients p
LEFT JOIN Appointments a ON p.PatientId = a.PatientId
LEFT JOIN Doctors d ON a.DoctorId = d.DoctorId
LEFT JOIN Specialties s ON d.SpecialtyId = s.SpecialtyId
LEFT JOIN Employees de ON d.EmployeeId = de.EmployeeId
LEFT JOIN Users du ON de.UserId = du.UserId
LEFT JOIN Rooms r ON a.RoomId = r.RoomId
LEFT JOIN Examinations ex ON a.AppointmentId = ex.AppointmentId
LEFT JOIN Prescriptions pr ON ex.ExaminationId = pr.ExaminationId
LEFT JOIN Invoices i ON ex.ExaminationId = i.ExaminationId AND i.Status <> 'Cancelled'
LEFT JOIN Payments pay ON i.InvoiceId = pay.InvoiceId
WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
ORDER BY p.PatientCode, a.AppointmentDate, a.AppointmentTime;
GO

PRINT '3) Orphan Appointments -> Patients';

SELECT
    a.AppointmentId,
    a.PatientId,
    a.DoctorId,
    a.AppointmentDate,
    a.AppointmentTime,
    a.Status
FROM Appointments a
LEFT JOIN Patients p ON a.PatientId = p.PatientId
WHERE p.PatientId IS NULL;
GO

PRINT '4) Orphan PrescriptionDetails -> Medicines';

SELECT
    pd.PrescriptionDetailId,
    pd.PrescriptionId,
    pd.MedicineId,
    pd.Quantity
FROM PrescriptionDetails pd
LEFT JOIN Medicines m ON pd.MedicineId = m.MedicineId
WHERE m.MedicineId IS NULL;
GO

PRINT '5) Duplicate active appointments by DoctorId + AppointmentDate + AppointmentTime';

SELECT
    DoctorId,
    AppointmentDate,
    AppointmentTime,
    COUNT(*) AS DuplicateCount,
    STRING_AGG(CAST(AppointmentId AS NVARCHAR(20)), ', ') AS AppointmentIds
FROM Appointments
WHERE Status NOT IN ('Cancelled', 'NoShow')
GROUP BY DoctorId, AppointmentDate, AppointmentTime
HAVING COUNT(*) > 1;
GO

PRINT '6) Duplicate active appointments by RoomId + AppointmentDate + AppointmentTime';

SELECT
    RoomId,
    AppointmentDate,
    AppointmentTime,
    COUNT(*) AS DuplicateCount,
    STRING_AGG(CAST(AppointmentId AS NVARCHAR(20)), ', ') AS AppointmentIds
FROM Appointments
WHERE Status NOT IN ('Cancelled', 'NoShow')
  AND RoomId IS NOT NULL
GROUP BY RoomId, AppointmentDate, AppointmentTime
HAVING COUNT(*) > 1;
GO

PRINT '7) Overlap DoctorSchedules';

SELECT
    ds1.ScheduleId AS ScheduleIdA,
    ds2.ScheduleId AS ScheduleIdB,
    ds1.DoctorId,
    ds1.WorkDate,
    ds1.StartTime AS StartTimeA,
    ds1.EndTime AS EndTimeA,
    ds2.StartTime AS StartTimeB,
    ds2.EndTime AS EndTimeB
FROM DoctorSchedules ds1
INNER JOIN DoctorSchedules ds2
    ON ds1.DoctorId = ds2.DoctorId
   AND ds1.WorkDate = ds2.WorkDate
   AND ds1.ScheduleId < ds2.ScheduleId
   AND ds1.IsActive = 1
   AND ds2.IsActive = 1
   AND ds1.StartTime < ds2.EndTime
   AND ds2.StartTime < ds1.EndTime;
GO

PRINT '8) Medicines with StockQuantity < 0';

SELECT
    MedicineId,
    MedicineName,
    Unit,
    StockQuantity,
    MinStockQuantity
FROM Medicines
WHERE StockQuantity < 0;
GO

PRINT '9) Paid invoices without payment';

SELECT
    i.InvoiceId,
    i.PatientId,
    p.PatientCode,
    p.FullName AS PatientName,
    i.ExaminationId,
    i.TotalAmount,
    i.Status,
    i.PaidAt
FROM Invoices i
INNER JOIN Patients p ON i.PatientId = p.PatientId
WHERE i.Status = 'Paid'
  AND NOT EXISTS (
      SELECT 1
      FROM Payments pay
      WHERE pay.InvoiceId = i.InvoiceId
  );
GO

PRINT '10) Dispensed prescriptions without InventoryTransactions OUT';

SELECT
    pr.PrescriptionId,
    pr.ExaminationId,
    p.PatientCode,
    p.FullName AS PatientName,
    pr.Status,
    pr.DispensedAt
FROM Prescriptions pr
INNER JOIN Examinations ex ON pr.ExaminationId = ex.ExaminationId
INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
INNER JOIN Patients p ON a.PatientId = p.PatientId
WHERE pr.Status = 'Dispensed'
  AND NOT EXISTS (
      SELECT 1
      FROM InventoryTransactions it
      WHERE it.TransactionType = 'OUT'
        AND it.ReferenceType = 'Prescription'
        AND it.ReferenceId = pr.PrescriptionId
  );
GO

PRINT '11) Demo medicines stock status';

SELECT
    MedicineId,
    MedicineName,
    Unit,
    Price,
    StockQuantity,
    MinStockQuantity,
    CASE
        WHEN StockQuantity = 0 THEN 'Out of stock'
        WHEN StockQuantity <= MinStockQuantity THEN 'Low stock'
        ELSE 'Normal'
    END AS StockStatus
FROM Medicines
WHERE MedicineName IN (
    N'Paracetamol 500mg',
    N'Vitamin C 500mg',
    N'Amlodipine 5mg',
    N'Natri Clorid 0.9% nhỏ mũi',
    N'Loratadine 10mg',
    N'Oresol cam gói ClinicCare Demo'
)
ORDER BY MedicineName;
GO
