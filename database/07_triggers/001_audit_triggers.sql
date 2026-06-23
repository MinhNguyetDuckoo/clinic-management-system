USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   001_audit_triggers.sql
   Trigger ghi log tự động khi cập nhật dữ liệu quan trọng
   ========================================================= */


/* =========================================================
   1. Audit khi cập nhật bệnh nhân
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Audit_Patients_Update
ON dbo.Patients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        OldData,
        NewData
    )
    SELECT
        NULL,
        'TRIGGER_UPDATE_PATIENT',
        'Patients',
        i.PatientId,
        CONCAT(
            N'Old FullName: ', ISNULL(d.FullName, N''), 
            N'; Old Phone: ', ISNULL(d.Phone, N'')
        ),
        CONCAT(
            N'New FullName: ', ISNULL(i.FullName, N''), 
            N'; New Phone: ', ISNULL(i.Phone, N'')
        )
    FROM inserted i
    INNER JOIN deleted d
        ON i.PatientId = d.PatientId;
END;
GO


/* =========================================================
   2. Audit khi cập nhật thuốc
   Đặc biệt quan trọng để theo dõi tồn kho
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Audit_Medicines_Update
ON dbo.Medicines
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        OldData,
        NewData
    )
    SELECT
        NULL,
        'TRIGGER_UPDATE_MEDICINE',
        'Medicines',
        i.MedicineId,
        CONCAT(
            N'Old Stock: ', d.StockQuantity,
            N'; Old Price: ', d.Price
        ),
        CONCAT(
            N'New Stock: ', i.StockQuantity,
            N'; New Price: ', i.Price
        )
    FROM inserted i
    INNER JOIN deleted d
        ON i.MedicineId = d.MedicineId
    WHERE 
        ISNULL(i.StockQuantity, -1) <> ISNULL(d.StockQuantity, -1)
        OR ISNULL(i.Price, -1) <> ISNULL(d.Price, -1)
        OR ISNULL(i.IsActive, 0) <> ISNULL(d.IsActive, 0)
        OR ISNULL(i.IsDeleted, 0) <> ISNULL(d.IsDeleted, 0);
END;
GO


/* =========================================================
   3. Audit khi cập nhật hóa đơn
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Audit_Invoices_Update
ON dbo.Invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        OldData,
        NewData
    )
    SELECT
        NULL,
        'TRIGGER_UPDATE_INVOICE',
        'Invoices',
        i.InvoiceId,
        CONCAT(
            N'Old Status: ', d.Status,
            N'; Old Total: ', d.TotalAmount
        ),
        CONCAT(
            N'New Status: ', i.Status,
            N'; New Total: ', i.TotalAmount
        )
    FROM inserted i
    INNER JOIN deleted d
        ON i.InvoiceId = d.InvoiceId
    WHERE 
        ISNULL(i.Status, '') <> ISNULL(d.Status, '')
        OR ISNULL(i.TotalAmount, 0) <> ISNULL(d.TotalAmount, 0);
END;
GO


/* =========================================================
   4. Audit khi cập nhật đơn thuốc
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Audit_Prescriptions_Update
ON dbo.Prescriptions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        OldData,
        NewData
    )
    SELECT
        NULL,
        'TRIGGER_UPDATE_PRESCRIPTION',
        'Prescriptions',
        i.PrescriptionId,
        CONCAT(
            N'Old Status: ', d.Status,
            N'; Old DispensedAt: ', COALESCE(CONVERT(NVARCHAR(30), d.DispensedAt, 120), N'NULL')
        ),
        CONCAT(
            N'New Status: ', i.Status,
            N'; New DispensedAt: ', COALESCE(CONVERT(NVARCHAR(30), i.DispensedAt, 120), N'NULL')
        )
    FROM inserted i
    INNER JOIN deleted d
        ON i.PrescriptionId = d.PrescriptionId
    WHERE 
        ISNULL(i.Status, '') <> ISNULL(d.Status, '')
        OR ISNULL(CONVERT(NVARCHAR(30), i.DispensedAt, 120), '') 
           <> ISNULL(CONVERT(NVARCHAR(30), d.DispensedAt, 120), '');
END;
GO


/* =========================================================
   5. Audit khi cap nhat lich lam viec bac si
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Audit_DoctorSchedules_Update
ON dbo.DoctorSchedules
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        OldData,
        NewData
    )
    SELECT
        NULL,
        'TRIGGER_UPDATE_DOCTOR_SCHEDULE',
        'DoctorSchedules',
        i.ScheduleId,
        CONCAT(
            N'Old DoctorId: ', d.DoctorId,
            N'; Old RoomId: ', ISNULL(CONVERT(NVARCHAR(20), d.RoomId), N'NULL'),
            N'; Old WorkDate: ', CONVERT(NVARCHAR(10), d.WorkDate, 120),
            N'; Old Time: ', CONVERT(NVARCHAR(8), d.StartTime), N'-', CONVERT(NVARCHAR(8), d.EndTime),
            N'; Old MaxPatients: ', d.MaxPatients,
            N'; Old IsActive: ', d.IsActive
        ),
        CONCAT(
            N'New DoctorId: ', i.DoctorId,
            N'; New RoomId: ', ISNULL(CONVERT(NVARCHAR(20), i.RoomId), N'NULL'),
            N'; New WorkDate: ', CONVERT(NVARCHAR(10), i.WorkDate, 120),
            N'; New Time: ', CONVERT(NVARCHAR(8), i.StartTime), N'-', CONVERT(NVARCHAR(8), i.EndTime),
            N'; New MaxPatients: ', i.MaxPatients,
            N'; New IsActive: ', i.IsActive
        )
    FROM inserted i
    INNER JOIN deleted d
        ON i.ScheduleId = d.ScheduleId
    WHERE
        ISNULL(i.DoctorId, -1) <> ISNULL(d.DoctorId, -1)
        OR ISNULL(i.RoomId, -1) <> ISNULL(d.RoomId, -1)
        OR ISNULL(CONVERT(NVARCHAR(10), i.WorkDate, 120), '') <> ISNULL(CONVERT(NVARCHAR(10), d.WorkDate, 120), '')
        OR ISNULL(CONVERT(NVARCHAR(8), i.StartTime), '') <> ISNULL(CONVERT(NVARCHAR(8), d.StartTime), '')
        OR ISNULL(CONVERT(NVARCHAR(8), i.EndTime), '') <> ISNULL(CONVERT(NVARCHAR(8), d.EndTime), '')
        OR ISNULL(i.MaxPatients, -1) <> ISNULL(d.MaxPatients, -1)
        OR ISNULL(i.IsActive, 0) <> ISNULL(d.IsActive, 0);
END;
GO
