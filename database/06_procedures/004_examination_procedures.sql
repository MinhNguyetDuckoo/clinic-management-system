USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   004_examination_procedures.sql
   Stored Procedure cho quy trình khám bệnh của bác sĩ
   ========================================================= */


/* =========================================================
   1. Lấy chi tiết phiếu khám
   Dùng khi bác sĩ bấm vào bệnh nhân trong hàng chờ
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetExaminationDetail
    @ExaminationId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ex.ExaminationId,
        ex.Status AS ExaminationStatus,
        ex.Symptoms,
        ex.Diagnosis,
        ex.Conclusion,
        ex.StartedAt,
        ex.FinishedAt,

        a.AppointmentId,
        a.AppointmentDate,
        a.AppointmentTime,
        a.Reason,
        a.Status AS AppointmentStatus,

        p.PatientId,
        p.PatientCode,
        p.FullName AS PatientName,
        p.Gender,
        p.DateOfBirth,
        dbo.fn_CalculateAge(p.DateOfBirth) AS Age,
        p.Phone,
        p.Email,
        p.Address,
        p.HealthInsuranceNumber,

        mr.MedicalRecordId,
        mr.RecordCode,

        d.DoctorId,
        u.FullName AS DoctorName,
        s.SpecialtyName
    FROM Examinations ex
    INNER JOIN Appointments a
        ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p
        ON a.PatientId = p.PatientId
    INNER JOIN MedicalRecords mr
        ON ex.MedicalRecordId = mr.MedicalRecordId
    INNER JOIN Doctors d
        ON ex.DoctorId = d.DoctorId
    INNER JOIN Employees e
        ON d.EmployeeId = e.EmployeeId
    INNER JOIN Users u
        ON e.UserId = u.UserId
    INNER JOIN Specialties s
        ON d.SpecialtyId = s.SpecialtyId
    WHERE ex.ExaminationId = @ExaminationId;

    SELECT
        so.ServiceOrderId,
        so.ServiceId,
        sv.ServiceName,
        sv.ServiceType,
        so.Quantity,
        sv.Price,
        so.Status,
        so.Result,
        so.OrderedAt,
        so.CompletedAt
    FROM ServiceOrders so
    INNER JOIN Services sv
        ON so.ServiceId = sv.ServiceId
    WHERE so.ExaminationId = @ExaminationId
    ORDER BY so.OrderedAt;
END;
GO


/* =========================================================
   2. Bắt đầu khám
   - Examination: Waiting -> InProgress
   - Appointment: CheckedIn -> InProgress
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_StartExamination
    @ExaminationId INT,
    @DoctorUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @AppointmentId INT;
        DECLARE @DoctorId INT;
        DECLARE @CurrentStatus NVARCHAR(50);

        SELECT
            @AppointmentId = AppointmentId,
            @DoctorId = DoctorId,
            @CurrentStatus = Status
        FROM Examinations WITH (UPDLOCK, HOLDLOCK)
        WHERE ExaminationId = @ExaminationId;

        IF @AppointmentId IS NULL
        BEGIN
            THROW 50301, N'Phiếu khám không tồn tại.', 1;
        END;

        IF @CurrentStatus <> 'Waiting'
        BEGIN
            THROW 50302, N'Phiếu khám không ở trạng thái Waiting.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Examinations ex WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN Appointments a
                ON ex.AppointmentId = a.AppointmentId
            WHERE ex.DoctorId = @DoctorId
              AND ex.ExaminationId <> @ExaminationId
              AND ex.Status = 'InProgress'
              AND a.AppointmentDate = CAST(SYSDATETIME() AS DATE)
        )
        BEGIN
            THROW 50308, N'Bac si dang kham mot benh nhan khac. Hay hoan tat ca dang kham truoc.', 1;
        END;

        UPDATE Examinations
        SET
            Status = 'InProgress',
            StartedAt = ISNULL(StartedAt, SYSDATETIME()),
            UpdatedAt = SYSDATETIME()
        WHERE ExaminationId = @ExaminationId;

        UPDATE Appointments
        SET
            Status = 'InProgress',
            UpdatedAt = SYSDATETIME()
        WHERE AppointmentId = @AppointmentId
          AND Status = 'CheckedIn';

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
            @DoctorUserId,
            'START_EXAMINATION',
            'Examinations',
            @ExaminationId,
            CONCAT(N'Started examination id: ', @ExaminationId)
        );

        COMMIT TRANSACTION;

        EXEC dbo.sp_GetExaminationDetail @ExaminationId = @ExaminationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   3. Lưu triệu chứng, chẩn đoán, kết luận
   Có thể gọi nhiều lần trong khi khám
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_SaveDiagnosis
    @ExaminationId INT,
    @Symptoms NVARCHAR(1000) = NULL,
    @Diagnosis NVARCHAR(1000) = NULL,
    @Conclusion NVARCHAR(1000) = NULL,
    @DoctorUserId INT = NULL
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
              AND Status = 'InProgress'
        )
        BEGIN
            THROW 50303, N'Phiếu khám không tồn tại hoặc chưa ở trạng thái InProgress.', 1;
        END;

        UPDATE Examinations
        SET
            Symptoms = @Symptoms,
            Diagnosis = @Diagnosis,
            Conclusion = @Conclusion,
            UpdatedAt = SYSDATETIME()
        WHERE ExaminationId = @ExaminationId;

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
            @DoctorUserId,
            'SAVE_DIAGNOSIS',
            'Examinations',
            @ExaminationId,
            CONCAT(N'Saved diagnosis for examination id: ', @ExaminationId)
        );

        COMMIT TRANSACTION;

        EXEC dbo.sp_GetExaminationDetail @ExaminationId = @ExaminationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   4. Chỉ định dịch vụ
   Ví dụ: xét nghiệm máu, siêu âm, điện tim
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreateServiceOrder
    @ExaminationId INT,
    @ServiceId INT,
    @Quantity INT = 1,
    @DoctorUserId INT = NULL,
    @NewServiceOrderId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Quantity <= 0
        BEGIN
            THROW 50304, N'Số lượng dịch vụ phải lớn hơn 0.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Examinations WITH (UPDLOCK, HOLDLOCK)
            WHERE ExaminationId = @ExaminationId
              AND Status = 'InProgress'
        )
        BEGIN
            THROW 50305, N'Phiếu khám không tồn tại hoặc không ở trạng thái InProgress.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Services
            WHERE ServiceId = @ServiceId
              AND IsActive = 1
        )
        BEGIN
            THROW 50306, N'Dịch vụ không tồn tại hoặc đã ngưng hoạt động.', 1;
        END;

        INSERT INTO ServiceOrders
        (
            ExaminationId,
            ServiceId,
            Quantity,
            Status
        )
        VALUES
        (
            @ExaminationId,
            @ServiceId,
            @Quantity,
            'Ordered'
        );

        SET @NewServiceOrderId = SCOPE_IDENTITY();

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
            @DoctorUserId,
            'CREATE_SERVICE_ORDER',
            'ServiceOrders',
            @NewServiceOrderId,
            CONCAT(N'Created service order id: ', @NewServiceOrderId)
        );

        COMMIT TRANSACTION;

        SELECT
            @NewServiceOrderId AS ServiceOrderId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   5. Cập nhật kết quả dịch vụ
   Dùng demo cho xét nghiệm / cận lâm sàng
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CompleteServiceOrder
    @ServiceOrderId INT,
    @Result NVARCHAR(1000) = NULL,
    @CompletedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM ServiceOrders WITH (UPDLOCK, HOLDLOCK)
            WHERE ServiceOrderId = @ServiceOrderId
              AND Status IN ('Ordered', 'Processing')
        )
        BEGIN
            THROW 50307, N'Chỉ định dịch vụ không tồn tại hoặc không thể hoàn tất.', 1;
        END;

        UPDATE ServiceOrders
        SET
            Status = 'Completed',
            Result = @Result,
            CompletedAt = SYSDATETIME()
        WHERE ServiceOrderId = @ServiceOrderId;

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
            @CompletedBy,
            'COMPLETE_SERVICE_ORDER',
            'ServiceOrders',
            @ServiceOrderId,
            CONCAT(N'Completed service order id: ', @ServiceOrderId)
        );

        COMMIT TRANSACTION;

        SELECT *
        FROM ServiceOrders
        WHERE ServiceOrderId = @ServiceOrderId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   6. Hoàn tất khám
   - Examination: Completed
   - Appointment: Completed
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_FinishExamination
    @ExaminationId INT,
    @DoctorUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @AppointmentId INT;

        SELECT @AppointmentId = AppointmentId
        FROM Examinations WITH (UPDLOCK, HOLDLOCK)
        WHERE ExaminationId = @ExaminationId
          AND Status = 'InProgress';

        IF @AppointmentId IS NULL
        BEGIN
            THROW 50308, N'Phiếu khám không tồn tại hoặc không ở trạng thái InProgress.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM ServiceOrders
            WHERE ExaminationId = @ExaminationId
              AND Status IN ('Ordered', 'Processing')
        )
        BEGIN
            THROW 50309, N'Vẫn còn dịch vụ chưa hoàn tất, không thể kết thúc khám.', 1;
        END;

        UPDATE Examinations
        SET
            Status = 'Completed',
            FinishedAt = SYSDATETIME(),
            UpdatedAt = SYSDATETIME()
        WHERE ExaminationId = @ExaminationId;

        UPDATE Appointments
        SET
            Status = 'Completed',
            UpdatedAt = SYSDATETIME()
        WHERE AppointmentId = @AppointmentId;

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
            @DoctorUserId,
            'FINISH_EXAMINATION',
            'Examinations',
            @ExaminationId,
            CONCAT(N'Finished examination id: ', @ExaminationId)
        );

        COMMIT TRANSACTION;

        EXEC dbo.sp_GetExaminationDetail @ExaminationId = @ExaminationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO
