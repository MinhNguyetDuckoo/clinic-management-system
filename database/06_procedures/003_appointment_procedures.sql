USE ClinicManagementDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   003_appointment_procedures.sql
   Stored Procedure cho lịch hẹn và check-in
   ========================================================= */

/* =========================================================
   1. Tạo lịch hẹn
   Chống lỗi:
   - Trùng lịch bác sĩ
   - Phantom khi 2 người đặt cùng lúc
   - Bệnh nhân / bác sĩ không tồn tại
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreateAppointment
    @PatientId INT,
    @DoctorId INT,
    @RoomId INT = NULL,
    @AppointmentDate DATE,
    @AppointmentTime TIME,
    @Reason NVARCHAR(500) = NULL,
    @CreatedBy INT = NULL,
    @NewAppointmentId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRANSACTION;

        IF @AppointmentDate < CAST(SYSDATETIME() AS DATE)
           OR (
                @AppointmentDate = CAST(SYSDATETIME() AS DATE)
                AND @AppointmentTime < CAST(SYSDATETIME() AS TIME)
           )
        BEGIN
            THROW 50200, N'Không thể tạo lịch hẹn ở thời gian trong quá khứ.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Patients
            WHERE PatientId = @PatientId
              AND IsDeleted = 0
        )
        BEGIN
            THROW 50201, N'Bệnh nhân không tồn tại.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Doctors
            WHERE DoctorId = @DoctorId
              AND IsActive = 1
        )
        BEGIN
            THROW 50202, N'Bác sĩ không tồn tại hoặc đã ngưng hoạt động.', 1;
        END;

        IF @RoomId IS NOT NULL
           AND NOT EXISTS (
                SELECT 1
                FROM Rooms
                WHERE RoomId = @RoomId
                  AND IsActive = 1
           )
        BEGIN
            THROW 50203, N'Phòng khám không tồn tại hoặc đã ngưng hoạt động.', 1;
        END;

        IF dbo.fn_IsDoctorWorking(@DoctorId, @AppointmentDate, @AppointmentTime) = 0
        BEGIN
            THROW 50204, N'Bác sĩ không có lịch làm việc vào thời gian này.', 1;
        END;

        DECLARE @ScheduleRoomId INT;

        SELECT TOP 1
            @ScheduleRoomId = RoomId
        FROM DoctorSchedules WITH (UPDLOCK, HOLDLOCK)
        WHERE DoctorId = @DoctorId
          AND WorkDate = @AppointmentDate
          AND @AppointmentTime >= StartTime
          AND @AppointmentTime < EndTime
          AND IsActive = 1
        ORDER BY StartTime DESC, ScheduleId DESC;

        IF @ScheduleRoomId IS NULL
        BEGIN
            THROW 50210, N'Ca làm việc của bác sĩ chưa được gán phòng khám.', 1;
        END;

        IF @RoomId IS NULL
        BEGIN
            SET @RoomId = @ScheduleRoomId;
        END;

        IF @RoomId <> @ScheduleRoomId
        BEGIN
            THROW 50211, N'Phòng khám không khớp với phòng đã gán trong lịch làm việc của bác sĩ.', 1;
        END;

        /*
           UPDLOCK + HOLDLOCK + SERIALIZABLE:
           Khóa vùng dữ liệu lịch hẹn của bác sĩ tại thời điểm này.
           Tránh 2 transaction cùng kiểm tra thấy trống rồi cùng insert.
        */
        IF EXISTS (
            SELECT 1
            FROM Appointments WITH (UPDLOCK, HOLDLOCK)
            WHERE DoctorId = @DoctorId
              AND AppointmentDate = @AppointmentDate
              AND AppointmentTime = @AppointmentTime
              AND Status <> 'Cancelled'
              AND Status <> 'NoShow'
        )
        BEGIN
            THROW 50205, N'Bác sĩ đã có lịch hẹn vào thời gian này.', 1;
        END;

        /*
           Chặn một bệnh nhân đặt nhiều lịch active cùng giờ
        */
        IF EXISTS (
            SELECT 1
            FROM Appointments WITH (UPDLOCK, HOLDLOCK)
            WHERE PatientId = @PatientId
              AND AppointmentDate = @AppointmentDate
              AND AppointmentTime = @AppointmentTime
              AND Status <> 'Cancelled'
              AND Status <> 'NoShow'
        )
        BEGIN
            THROW 50206, N'Bệnh nhân đã có lịch hẹn vào thời gian này.', 1;
        END;

        IF @RoomId IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Appointments WITH (UPDLOCK, HOLDLOCK)
                WHERE RoomId = @RoomId
                  AND AppointmentDate = @AppointmentDate
                  AND AppointmentTime = @AppointmentTime
                  AND Status <> 'Cancelled'
                  AND Status <> 'NoShow'
           )
        BEGIN
            THROW 50207, N'PhÃ²ng Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng vÃ o thá»i gian nÃ y.', 1;
        END;

        INSERT INTO Appointments
        (
            PatientId,
            DoctorId,
            RoomId,
            AppointmentDate,
            AppointmentTime,
            Reason,
            Status,
            CreatedBy
        )
        VALUES
        (
            @PatientId,
            @DoctorId,
            @RoomId,
            @AppointmentDate,
            @AppointmentTime,
            @Reason,
            'Scheduled',
            @CreatedBy
        );

        SET @NewAppointmentId = SCOPE_IDENTITY();

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
            'CREATE_APPOINTMENT',
            'Appointments',
            @NewAppointmentId,
            CONCAT(N'Created appointment id: ', @NewAppointmentId)
        );

        COMMIT TRANSACTION;

        SELECT
            @NewAppointmentId AS AppointmentId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   2. Check-in bệnh nhân
   - Chuyển Appointment sang CheckedIn
   - Tạo MedicalRecord nếu bệnh nhân chưa có
   - Tạo Examination nếu chưa có
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CheckInPatient
    @AppointmentId INT,
    @CheckedInBy INT = NULL,
    @NewExaminationId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @PatientId INT;
        DECLARE @DoctorId INT;
        DECLARE @MedicalRecordId INT;
        DECLARE @RecordCode NVARCHAR(30);

        SELECT
            @PatientId = PatientId,
            @DoctorId = DoctorId
        FROM Appointments WITH (UPDLOCK, HOLDLOCK)
        WHERE AppointmentId = @AppointmentId
          AND Status = 'Scheduled';

        IF @PatientId IS NULL
        BEGIN
            THROW 50207, N'Lịch hẹn không tồn tại hoặc không ở trạng thái Scheduled.', 1;
        END;

        UPDATE Appointments
        SET
            Status = 'CheckedIn',
            UpdatedAt = SYSDATETIME()
        WHERE AppointmentId = @AppointmentId;

        SELECT TOP 1 @MedicalRecordId = MedicalRecordId
        FROM MedicalRecords WITH (UPDLOCK, HOLDLOCK)
        WHERE PatientId = @PatientId
        ORDER BY CreatedAt DESC, MedicalRecordId DESC;

        IF @MedicalRecordId IS NULL
        BEGIN
            SET @RecordCode = dbo.fn_GenerateNextMedicalRecordCode();

            INSERT INTO MedicalRecords
            (
                PatientId,
                RecordCode
            )
            VALUES
            (
                @PatientId,
                @RecordCode
            );

            SET @MedicalRecordId = SCOPE_IDENTITY();
        END;

        IF EXISTS (
            SELECT 1
            FROM Examinations
            WHERE AppointmentId = @AppointmentId
        )
        BEGIN
            SELECT @NewExaminationId = ExaminationId
            FROM Examinations
            WHERE AppointmentId = @AppointmentId;
        END
        ELSE
        BEGIN
            INSERT INTO Examinations
            (
                AppointmentId,
                MedicalRecordId,
                DoctorId,
                Status
            )
            VALUES
            (
                @AppointmentId,
                @MedicalRecordId,
                @DoctorId,
                'Waiting'
            );

            SET @NewExaminationId = SCOPE_IDENTITY();
        END;

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
            @CheckedInBy,
            'CHECK_IN_PATIENT',
            'Appointments',
            @AppointmentId,
            CONCAT(N'Checked in appointment id: ', @AppointmentId)
        );

        COMMIT TRANSACTION;

        SELECT
            @AppointmentId AS AppointmentId,
            @NewExaminationId AS ExaminationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   3. Hủy lịch hẹn
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CancelAppointment
    @AppointmentId INT,
    @CancelledBy INT = NULL,
    @CancelReason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM Appointments WITH (UPDLOCK, HOLDLOCK)
            WHERE AppointmentId = @AppointmentId
              AND Status IN ('Scheduled', 'CheckedIn')
        )
        BEGIN
            THROW 50208, N'Lịch hẹn không tồn tại hoặc không thể hủy.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Examinations
            WHERE AppointmentId = @AppointmentId
              AND Status IN ('InProgress', 'Completed')
        )
        BEGIN
            THROW 50209, N'Lịch hẹn đã bắt đầu khám hoặc hoàn tất, không thể hủy.', 1;
        END;

        UPDATE Appointments
        SET
            Status = 'Cancelled',
            CancelledBy = @CancelledBy,
            CancelReason = @CancelReason,
            UpdatedAt = SYSDATETIME()
        WHERE AppointmentId = @AppointmentId;

        UPDATE Examinations
        SET
            Status = 'Cancelled',
            UpdatedAt = SYSDATETIME()
        WHERE AppointmentId = @AppointmentId
          AND Status = 'Waiting';

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
            @CancelledBy,
            'CANCEL_APPOINTMENT',
            'Appointments',
            @AppointmentId,
            CONCAT(N'Cancelled appointment id: ', @AppointmentId, N'. Reason: ', ISNULL(@CancelReason, N''))
        );

        COMMIT TRANSACTION;

        SELECT
            @AppointmentId AS AppointmentId,
            'Cancelled' AS Status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   4. Lấy lịch hẹn theo ngày
   Dùng cho UI lễ tân
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetAppointmentsByDate
    @AppointmentDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.AppointmentId,
        a.AppointmentDate,
        a.AppointmentTime,
        a.Status,
        a.Reason,
        a.CancelReason,

        p.PatientId,
        p.PatientCode,
        p.FullName AS PatientName,
        p.Phone AS PatientPhone,

        d.DoctorId,
        u.FullName AS DoctorName,
        s.SpecialtyName,

        r.RoomId,
        r.RoomName,

        a.CreatedAt,
        a.UpdatedAt
    FROM Appointments a
    INNER JOIN Patients p
        ON a.PatientId = p.PatientId
    INNER JOIN Doctors d
        ON a.DoctorId = d.DoctorId
    INNER JOIN Employees e
        ON d.EmployeeId = e.EmployeeId
    INNER JOIN Users u
        ON e.UserId = u.UserId
    INNER JOIN Specialties s
        ON d.SpecialtyId = s.SpecialtyId
    LEFT JOIN Rooms r
        ON a.RoomId = r.RoomId
    WHERE a.AppointmentDate = @AppointmentDate
    ORDER BY a.AppointmentTime;
END;
GO
