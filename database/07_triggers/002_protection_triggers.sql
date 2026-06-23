USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   002_protection_triggers.sql
   Trigger bảo vệ dữ liệu quan trọng
   ========================================================= */


/* =========================================================
   1. Không cho xóa hóa đơn đã thanh toán
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_PaidInvoice
ON dbo.Invoices
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted
        WHERE Status = 'Paid'
    )
    BEGIN
        THROW 50601, N'Không được xóa hóa đơn đã thanh toán.', 1;
    END;

    DELETE id
    FROM InvoiceDetails id
    INNER JOIN deleted d
        ON id.InvoiceId = d.InvoiceId;

    DELETE p
    FROM Payments p
    INNER JOIN deleted d
        ON p.InvoiceId = d.InvoiceId;

    DELETE i
    FROM Invoices i
    INNER JOIN deleted d
        ON i.InvoiceId = d.InvoiceId;
END;
GO


/* =========================================================
   2. Không cho xóa đơn thuốc đã cấp
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_DispensedPrescription
ON dbo.Prescriptions
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted
        WHERE Status = 'Dispensed'
    )
    BEGIN
        THROW 50602, N'Không được xóa đơn thuốc đã cấp.', 1;
    END;

    DELETE it
    FROM InventoryTransactions it
    INNER JOIN deleted d
        ON it.ReferenceType = 'Prescription'
       AND it.ReferenceId = d.PrescriptionId;

    DELETE pd
    FROM PrescriptionDetails pd
    INNER JOIN deleted d
        ON pd.PrescriptionId = d.PrescriptionId;

    DELETE pr
    FROM Prescriptions pr
    INNER JOIN deleted d
        ON pr.PrescriptionId = d.PrescriptionId;
END;
GO


/* =========================================================
   3. Không cho xóa bệnh nhân đã có lịch hẹn hoặc hồ sơ khám
   Gợi ý nghiệp vụ: dùng soft delete thay vì delete cứng.
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_Patient_WithHistory
ON dbo.Patients
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted d
        WHERE EXISTS (
            SELECT 1
            FROM Appointments a
            WHERE a.PatientId = d.PatientId
        )
        OR EXISTS (
            SELECT 1
            FROM MedicalRecords mr
            WHERE mr.PatientId = d.PatientId
        )
    )
    BEGIN
        THROW 50603, N'Không được xóa bệnh nhân đã có lịch hẹn hoặc hồ sơ bệnh án. Hãy dùng soft delete.', 1;
    END;

    DELETE p
    FROM Patients p
    INNER JOIN deleted d
        ON p.PatientId = d.PatientId;
END;
GO


/* =========================================================
   4. Khong cho DELETE cung lich lam viec bac si
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_DoctorSchedules
ON dbo.DoctorSchedules
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50604, N'Khong duoc xoa cung lich lam viec bac si. Hay cap nhat IsActive = 0.', 1;
END;
GO


/* =========================================================
   5. Khong cho DELETE cung thuoc
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_Medicines
ON dbo.Medicines
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50605, N'Khong duoc xoa cung thuoc. Hay cap nhat IsActive = 0 hoac dung soft delete.', 1;
END;
GO


/* =========================================================
   6. Khong cho DELETE cung bac si
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_Doctors
ON dbo.Doctors
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50606, N'Khong duoc xoa cung bac si. Hay cap nhat IsActive = 0.', 1;
END;
GO


/* =========================================================
   7. Khong cho DELETE cung lich hen
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_Appointments
ON dbo.Appointments
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50607, N'Khong duoc xoa cung lich hen. Hay cap nhat trang thai Cancelled.', 1;
END;
GO


/* =========================================================
   8. Khong cho DELETE cung phong kham
   ========================================================= */
CREATE OR ALTER TRIGGER dbo.trg_Prevent_Delete_Rooms
ON dbo.Rooms
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 50608, N'Khong duoc xoa cung phong kham. Hay cap nhat IsActive = 0.', 1;
END;
GO
