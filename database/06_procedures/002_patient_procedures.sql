USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   002_patient_procedures.sql
   Stored Procedure cho quản lý bệnh nhân
   ========================================================= */


/* =========================================================
   1. Tạo bệnh nhân mới
   - Tự tạo PatientCode
   - Tự tạo MedicalRecord
   - Có transaction để tránh cập nhật nửa vời
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreatePatient
    @UserId INT = NULL,
    @FullName NVARCHAR(150),
    @Gender NVARCHAR(10) = NULL,
    @DateOfBirth DATE = NULL,
    @Phone NVARCHAR(20) = NULL,
    @Email NVARCHAR(150) = NULL,
    @Address NVARCHAR(255) = NULL,
    @HealthInsuranceNumber NVARCHAR(50) = NULL,
    @EmergencyContactName NVARCHAR(150) = NULL,
    @EmergencyContactPhone NVARCHAR(20) = NULL,
    @CreatedBy INT = NULL,
    @NewPatientId INT OUTPUT,
    @NewMedicalRecordId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRANSACTION;

        DECLARE @PatientCode NVARCHAR(30);
        DECLARE @RecordCode NVARCHAR(30);

        IF @UserId IS NOT NULL
           AND NOT EXISTS (
                SELECT 1
                FROM Users
                WHERE UserId = @UserId
                  AND IsDeleted = 0
           )
        BEGIN
            THROW 50101, N'UserId không tồn tại.', 1;
        END;

        IF @UserId IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Patients WITH (UPDLOCK, HOLDLOCK)
                WHERE UserId = @UserId
           )
        BEGIN
            THROW 50102, N'User này đã được liên kết với một bệnh nhân.', 1;
        END;

        IF @Phone IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Patients WITH (UPDLOCK, HOLDLOCK)
                WHERE Phone = @Phone
                  AND IsDeleted = 0
           )
        BEGIN
            THROW 50103, N'Số điện thoại bệnh nhân đã tồn tại.', 1;
        END;

        SET @PatientCode = dbo.fn_GenerateNextPatientCode();

        INSERT INTO Patients
        (
            UserId,
            PatientCode,
            FullName,
            Gender,
            DateOfBirth,
            Phone,
            Email,
            Address,
            HealthInsuranceNumber,
            EmergencyContactName,
            EmergencyContactPhone
        )
        VALUES
        (
            @UserId,
            @PatientCode,
            @FullName,
            @Gender,
            @DateOfBirth,
            @Phone,
            @Email,
            @Address,
            @HealthInsuranceNumber,
            @EmergencyContactName,
            @EmergencyContactPhone
        );

        SET @NewPatientId = SCOPE_IDENTITY();

        SET @RecordCode = dbo.fn_GenerateNextMedicalRecordCode();

        INSERT INTO MedicalRecords
        (
            PatientId,
            RecordCode
        )
        VALUES
        (
            @NewPatientId,
            @RecordCode
        );

        SET @NewMedicalRecordId = SCOPE_IDENTITY();

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
            'CREATE_PATIENT',
            'Patients',
            @NewPatientId,
            CONCAT(N'Created patient: ', @FullName, N' - ', @PatientCode)
        );

        COMMIT TRANSACTION;

        SELECT
            @NewPatientId AS PatientId,
            @PatientCode AS PatientCode,
            @NewMedicalRecordId AS MedicalRecordId,
            @RecordCode AS RecordCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   2. Cập nhật thông tin bệnh nhân
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_UpdatePatient
    @PatientId INT,
    @FullName NVARCHAR(150),
    @Gender NVARCHAR(10) = NULL,
    @DateOfBirth DATE = NULL,
    @Phone NVARCHAR(20) = NULL,
    @Email NVARCHAR(150) = NULL,
    @Address NVARCHAR(255) = NULL,
    @HealthInsuranceNumber NVARCHAR(50) = NULL,
    @EmergencyContactName NVARCHAR(150) = NULL,
    @EmergencyContactPhone NVARCHAR(20) = NULL,
    @UpdatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM Patients WITH (UPDLOCK, HOLDLOCK)
            WHERE PatientId = @PatientId
              AND IsDeleted = 0
        )
        BEGIN
            THROW 50104, N'Bệnh nhân không tồn tại.', 1;
        END;

        IF @Phone IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Patients WITH (UPDLOCK, HOLDLOCK)
                WHERE Phone = @Phone
                  AND PatientId <> @PatientId
                  AND IsDeleted = 0
           )
        BEGIN
            THROW 50105, N'Số điện thoại đã được sử dụng bởi bệnh nhân khác.', 1;
        END;

        UPDATE Patients
        SET
            FullName = @FullName,
            Gender = @Gender,
            DateOfBirth = @DateOfBirth,
            Phone = @Phone,
            Email = @Email,
            Address = @Address,
            HealthInsuranceNumber = @HealthInsuranceNumber,
            EmergencyContactName = @EmergencyContactName,
            EmergencyContactPhone = @EmergencyContactPhone,
            UpdatedAt = SYSDATETIME()
        WHERE PatientId = @PatientId;

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
            @UpdatedBy,
            'UPDATE_PATIENT',
            'Patients',
            @PatientId,
            CONCAT(N'Updated patient id: ', @PatientId)
        );

        COMMIT TRANSACTION;

        SELECT *
        FROM Patients
        WHERE PatientId = @PatientId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   3. Lấy bệnh nhân theo ID
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetPatientById
    @PatientId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.PatientId,
        p.UserId,
        p.PatientCode,
        p.FullName,
        p.Gender,
        p.DateOfBirth,
        dbo.fn_CalculateAge(p.DateOfBirth) AS Age,
        p.Phone,
        p.Email,
        p.Address,
        p.HealthInsuranceNumber,
        p.EmergencyContactName,
        p.EmergencyContactPhone,
        mr.MedicalRecordId,
        mr.RecordCode,
        p.CreatedAt,
        p.UpdatedAt
    FROM Patients p
    OUTER APPLY (
        SELECT TOP 1
            mr.MedicalRecordId,
            mr.RecordCode
        FROM MedicalRecords mr
        WHERE mr.PatientId = p.PatientId
        ORDER BY mr.CreatedAt DESC, mr.MedicalRecordId DESC
    ) mr
    WHERE p.PatientId = @PatientId
      AND p.IsDeleted = 0;
END;
GO


/* =========================================================
   4. Tìm kiếm bệnh nhân
   @Keyword có thể là ID, tên, mã bệnh nhân, số điện thoại, email
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_SearchPatients
    @Keyword NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @KeywordAsInt INT = TRY_CAST(@Keyword AS INT);

    SELECT
        p.PatientId,
        p.PatientCode,
        p.FullName,
        p.Gender,
        p.DateOfBirth,
        dbo.fn_CalculateAge(p.DateOfBirth) AS Age,
        p.Phone,
        p.Email,
        p.Address,
        p.HealthInsuranceNumber,
        p.EmergencyContactName,
        p.EmergencyContactPhone,
        mr.MedicalRecordId,
        mr.RecordCode,
        p.CreatedAt
    FROM Patients p
    OUTER APPLY (
        SELECT TOP 1
            mr.MedicalRecordId,
            mr.RecordCode
        FROM MedicalRecords mr
        WHERE mr.PatientId = p.PatientId
        ORDER BY mr.CreatedAt DESC, mr.MedicalRecordId DESC
    ) mr
    WHERE p.IsDeleted = 0
      AND (
            @Keyword IS NULL
            OR (
                @KeywordAsInt IS NOT NULL
                AND p.PatientId = @KeywordAsInt
            )
            OR (
                @KeywordAsInt IS NULL
                AND (
                    p.PatientCode LIKE '%' + @Keyword + '%'
                    OR p.FullName LIKE '%' + @Keyword + '%'
                    OR p.Phone LIKE '%' + @Keyword + '%'
                    OR p.Email LIKE '%' + @Keyword + '%'
                )
            )
      )
    ORDER BY p.CreatedAt DESC;
END;
GO
