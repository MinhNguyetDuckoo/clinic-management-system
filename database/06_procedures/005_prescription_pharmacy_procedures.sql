USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   005_prescription_pharmacy_procedures.sql
   Stored Procedure cho đơn thuốc và cấp thuốc
   ========================================================= */


/* =========================================================
   1. Tạo đơn thuốc
   - Một phiếu khám có thể có 1 đơn thuốc chính
   - Cho phép tạo khi phiếu khám InProgress hoặc Completed
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreatePrescription
    @ExaminationId INT,
    @DoctorId INT,
    @Note NVARCHAR(1000) = NULL,
    @CreatedBy INT = NULL,
    @NewPrescriptionId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM Examinations WITH (UPDLOCK, HOLDLOCK)
            WHERE ExaminationId = @ExaminationId
              AND Status IN ('InProgress', 'Completed')
        )
        BEGIN
            THROW 50401, N'Phiếu khám không tồn tại hoặc chưa thể kê đơn.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Doctors
            WHERE DoctorId = @DoctorId
              AND IsActive = 1
        )
        BEGIN
            THROW 50402, N'Bác sĩ không tồn tại hoặc đã ngưng hoạt động.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Prescriptions WITH (UPDLOCK, HOLDLOCK)
            WHERE ExaminationId = @ExaminationId
              AND Status <> 'Cancelled'
        )
        BEGIN
            THROW 50403, N'Phiếu khám này đã có đơn thuốc.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Invoices WITH (UPDLOCK, HOLDLOCK)
            WHERE ExaminationId = @ExaminationId
              AND Status <> 'Cancelled'
        )
        BEGIN
            THROW 50412, N'Phieu kham da co hoa don, khong the ke don moi.', 1;
        END;

        INSERT INTO Prescriptions
        (
            ExaminationId,
            DoctorId,
            Status,
            Note
        )
        VALUES
        (
            @ExaminationId,
            @DoctorId,
            'Pending',
            @Note
        );

        SET @NewPrescriptionId = SCOPE_IDENTITY();

        INSERT INTO AuditLogs
        (
            UserId,
            Action,
            TableName,
            RecordId,
            NewData
        )
        VALUES
        (
            @CreatedBy,
            'CREATE_PRESCRIPTION',
            'Prescriptions',
            @NewPrescriptionId,
            CONCAT(N'Created prescription id: ', @NewPrescriptionId)
        );

        COMMIT TRANSACTION;

        SELECT @NewPrescriptionId AS PrescriptionId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   2. Thêm thuốc vào đơn thuốc
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_AddPrescriptionDetail
    @PrescriptionId INT,
    @MedicineId INT,
    @Quantity INT,
    @Dosage NVARCHAR(255) = NULL,
    @UsageInstruction NVARCHAR(500) = NULL,
    @CreatedBy INT = NULL,
    @NewPrescriptionDetailId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Quantity <= 0
        BEGIN
            THROW 50404, N'Số lượng thuốc phải lớn hơn 0.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Prescriptions WITH (UPDLOCK, HOLDLOCK)
            WHERE PrescriptionId = @PrescriptionId
              AND Status = 'Pending'
        )
        BEGIN
            THROW 50405, N'Đơn thuốc không tồn tại hoặc không còn ở trạng thái Pending.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Medicines
            WHERE MedicineId = @MedicineId
              AND IsActive = 1
              AND IsDeleted = 0
        )
        BEGIN
            THROW 50406, N'Thuốc không tồn tại hoặc đã ngưng sử dụng.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Medicines WITH (UPDLOCK, HOLDLOCK)
            WHERE MedicineId = @MedicineId
              AND StockQuantity < @Quantity
        )
        BEGIN
            THROW 50411, N'So luong ke don vuot qua ton kho hien co.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM PrescriptionDetails
            WHERE PrescriptionId = @PrescriptionId
              AND MedicineId = @MedicineId
        )
        BEGIN
            THROW 50407, N'Thuốc này đã có trong đơn.', 1;
        END;

        INSERT INTO PrescriptionDetails
        (
            PrescriptionId,
            MedicineId,
            Quantity,
            Dosage,
            UsageInstruction
        )
        VALUES
        (
            @PrescriptionId,
            @MedicineId,
            @Quantity,
            @Dosage,
            @UsageInstruction
        );

        SET @NewPrescriptionDetailId = SCOPE_IDENTITY();

        INSERT INTO AuditLogs
        (
            UserId,
            Action,
            TableName,
            RecordId,
            NewData
        )
        VALUES
        (
            @CreatedBy,
            'ADD_PRESCRIPTION_DETAIL',
            'PrescriptionDetails',
            @NewPrescriptionDetailId,
            CONCAT(N'Added medicine id: ', @MedicineId, N' to prescription id: ', @PrescriptionId)
        );

        COMMIT TRANSACTION;

        SELECT @NewPrescriptionDetailId AS PrescriptionDetailId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   2b. Xóa thuốc khỏi đơn thuốc Pending
   Dùng để sửa đơn kê sai trước khi dược sĩ cấp thuốc
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_DeletePrescriptionDetail
    @PrescriptionDetailId INT,
    @DeletedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @PrescriptionId INT;
        DECLARE @MedicineId INT;

        SELECT
            @PrescriptionId = pd.PrescriptionId,
            @MedicineId = pd.MedicineId
        FROM PrescriptionDetails pd WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Prescriptions pr WITH (UPDLOCK, HOLDLOCK)
            ON pd.PrescriptionId = pr.PrescriptionId
        WHERE pd.PrescriptionDetailId = @PrescriptionDetailId
          AND pr.Status = 'Pending';

        IF @PrescriptionId IS NULL
        BEGIN
            THROW 50412, N'Chi tiet don thuoc khong ton tai hoac don khong con Pending.', 1;
        END;

        DELETE FROM PrescriptionDetails
        WHERE PrescriptionDetailId = @PrescriptionDetailId;

        INSERT INTO AuditLogs
        (
            UserId,
            Action,
            TableName,
            RecordId,
            NewData
        )
        VALUES
        (
            @DeletedBy,
            'DELETE_PRESCRIPTION_DETAIL',
            'PrescriptionDetails',
            @PrescriptionDetailId,
            CONCAT(N'Deleted medicine id: ', @MedicineId, N' from prescription id: ', @PrescriptionId)
        );

        COMMIT TRANSACTION;

        SELECT @PrescriptionId AS PrescriptionId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   3. Lấy chi tiết đơn thuốc
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetPrescriptionDetail
    @PrescriptionId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pr.PrescriptionId,
        pr.ExaminationId,
        pr.Status,
        pr.Note,
        pr.CreatedAt,
        pr.DispensedAt,

        p.PatientId,
        p.PatientCode,
        p.FullName AS PatientName,
        p.Phone AS PatientPhone,

        d.DoctorId,
        u.FullName AS DoctorName
    FROM Prescriptions pr
    INNER JOIN Examinations ex
        ON pr.ExaminationId = ex.ExaminationId
    INNER JOIN Appointments a
        ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p
        ON a.PatientId = p.PatientId
    INNER JOIN Doctors d
        ON pr.DoctorId = d.DoctorId
    INNER JOIN Employees e
        ON d.EmployeeId = e.EmployeeId
    INNER JOIN Users u
        ON e.UserId = u.UserId
    WHERE pr.PrescriptionId = @PrescriptionId;

    SELECT
        pd.PrescriptionDetailId,
        pd.MedicineId,
        m.MedicineName,
        m.Unit,
        pd.Quantity,
        pd.Dosage,
        pd.UsageInstruction,
        m.Price,
        m.StockQuantity,
        CASE
            WHEN m.StockQuantity >= pd.Quantity THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS IsEnoughStock
    FROM PrescriptionDetails pd
    INNER JOIN Medicines m
        ON pd.MedicineId = m.MedicineId
    WHERE pd.PrescriptionId = @PrescriptionId;
END;
GO


/* =========================================================
   4. Lấy danh sách đơn thuốc chờ cấp
   Dùng cho UI dược sĩ
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetPendingPrescriptions
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_Pharmacist_PendingPrescriptions
    ORDER BY CreatedAt DESC;
END;
GO


/* =========================================================
   5. Cấp thuốc
   Đây là procedure quan trọng để chống Lost Update.
   - Khóa đơn thuốc
   - Khóa các dòng thuốc cần trừ kho
   - Kiểm tra tồn kho
   - Trừ kho
   - Ghi InventoryTransactions
   - Cập nhật đơn thuốc Dispensed
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_DispenseMedicine
    @PrescriptionId INT,
    @DispensedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM Prescriptions WITH (UPDLOCK, HOLDLOCK)
            WHERE PrescriptionId = @PrescriptionId
              AND Status = 'Pending'
        )
        BEGIN
            THROW 50408, N'Đơn thuốc không tồn tại hoặc đã được cấp/hủy.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM PrescriptionDetails
            WHERE PrescriptionId = @PrescriptionId
        )
        BEGIN
            THROW 50409, N'Đơn thuốc chưa có thuốc.', 1;
        END;

        /*
           Khóa các thuốc cần trừ kho.
           UPDLOCK + HOLDLOCK giúp tránh 2 dược sĩ cùng trừ một thuốc gây Lost Update.
        */
        IF EXISTS (
            SELECT 1
            FROM PrescriptionDetails pd
            INNER JOIN Medicines m WITH (UPDLOCK, HOLDLOCK)
                ON pd.MedicineId = m.MedicineId
            WHERE pd.PrescriptionId = @PrescriptionId
              AND (
                    m.IsDeleted = 1
                    OR m.IsActive = 0
                    OR m.StockQuantity < pd.Quantity
                  )
        )
        BEGIN
            THROW 50410, N'Tồn kho không đủ hoặc thuốc không còn hoạt động.', 1;
        END;

        UPDATE m
        SET
            m.StockQuantity = m.StockQuantity - pd.Quantity,
            m.UpdatedAt = SYSDATETIME()
        FROM Medicines m
        INNER JOIN PrescriptionDetails pd
            ON m.MedicineId = pd.MedicineId
        WHERE pd.PrescriptionId = @PrescriptionId;

        INSERT INTO InventoryTransactions
        (
            MedicineId,
            TransactionType,
            Quantity,
            ReferenceType,
            ReferenceId,
            Note,
            CreatedBy
        )
        SELECT
            pd.MedicineId,
            'OUT',
            pd.Quantity,
            'Prescription',
            @PrescriptionId,
            N'Cấp thuốc theo đơn',
            @DispensedBy
        FROM PrescriptionDetails pd
        WHERE pd.PrescriptionId = @PrescriptionId;

        UPDATE Prescriptions
        SET
            Status = 'Dispensed',
            DispensedBy = @DispensedBy,
            DispensedAt = SYSDATETIME()
        WHERE PrescriptionId = @PrescriptionId;

        INSERT INTO AuditLogs
        (
            UserId,
            Action,
            TableName,
            RecordId,
            NewData
        )
        VALUES
        (
            @DispensedBy,
            'DISPENSE_MEDICINE',
            'Prescriptions',
            @PrescriptionId,
            CONCAT(N'Dispensed prescription id: ', @PrescriptionId)
        );

        COMMIT TRANSACTION;

        EXEC dbo.sp_GetPrescriptionDetail @PrescriptionId = @PrescriptionId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO
