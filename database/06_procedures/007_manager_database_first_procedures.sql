USE ClinicManagementDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   Manager - DoctorSchedules database-first procedures
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_CreateDoctorSchedule
    @DoctorId INT,
    @RoomId INT,
    @WorkDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @MaxPatients INT,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @DoctorId IS NULL OR @RoomId IS NULL OR @WorkDate IS NULL OR @StartTime IS NULL OR @EndTime IS NULL
            THROW 50700, N'Thieu thong tin bat buoc de tao lich lam viec.', 1;

        IF @StartTime >= @EndTime
            THROW 50701, N'Gio bat dau phai nho hon gio ket thuc.', 1;

        IF @MaxPatients IS NULL OR @MaxPatients <= 0
            THROW 50702, N'So benh nhan toi da phai lon hon 0.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM Doctors d
            INNER JOIN Employees e ON d.EmployeeId = e.EmployeeId
            INNER JOIN Users u ON e.UserId = u.UserId
            WHERE d.DoctorId = @DoctorId
              AND d.IsActive = 1
              AND e.IsActive = 1
              AND e.IsDeleted = 0
              AND u.IsActive = 1
              AND u.IsDeleted = 0
        )
            THROW 50703, N'Bac si khong ton tai hoac da ngung hoat dong.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM Rooms WHERE RoomId = @RoomId AND IsActive = 1
        )
            THROW 50704, N'Phong kham khong ton tai hoac da ngung hoat dong.', 1;

        IF @IsActive = 1 AND EXISTS (
            SELECT 1
            FROM DoctorSchedules WITH (UPDLOCK, HOLDLOCK)
            WHERE DoctorId = @DoctorId
              AND WorkDate = @WorkDate
              AND IsActive = 1
              AND @StartTime < EndTime
              AND @EndTime > StartTime
        )
            THROW 50705, N'Trung lich lam viec cua bac si trong ngay nay.', 1;

        DECLARE @NewSchedule TABLE (ScheduleId INT);

        INSERT INTO DoctorSchedules
            (DoctorId, RoomId, WorkDate, StartTime, EndTime, MaxPatients, IsActive)
        OUTPUT inserted.ScheduleId INTO @NewSchedule
        VALUES
            (@DoctorId, @RoomId, @WorkDate, @StartTime, @EndTime, @MaxPatients, @IsActive);

        COMMIT TRANSACTION;

        SELECT
            ds.ScheduleId,
            ds.DoctorId,
            u.FullName AS DoctorName,
            ds.RoomId,
            r.RoomName,
            ds.WorkDate,
            ds.StartTime,
            ds.EndTime,
            ds.MaxPatients,
            ds.IsActive,
            ds.CreatedAt,
            CAST(NULL AS DATETIME2) AS UpdatedAt
        FROM DoctorSchedules ds
        INNER JOIN Doctors d ON ds.DoctorId = d.DoctorId
        INNER JOIN Employees e ON d.EmployeeId = e.EmployeeId
        INNER JOIN Users u ON e.UserId = u.UserId
        LEFT JOIN Rooms r ON ds.RoomId = r.RoomId
        WHERE ds.ScheduleId = (SELECT TOP 1 ScheduleId FROM @NewSchedule);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateDoctorSchedule
    @ScheduleId INT,
    @RoomId INT,
    @WorkDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @MaxPatients INT,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @ScheduleId IS NULL OR @RoomId IS NULL OR @WorkDate IS NULL OR @StartTime IS NULL OR @EndTime IS NULL
            THROW 50710, N'Thieu thong tin bat buoc de cap nhat lich lam viec.', 1;

        IF @StartTime >= @EndTime
            THROW 50711, N'Gio bat dau phai nho hon gio ket thuc.', 1;

        IF @MaxPatients IS NULL OR @MaxPatients <= 0
            THROW 50712, N'So benh nhan toi da phai lon hon 0.', 1;

        DECLARE @DoctorId INT;
        DECLARE @OldRoomId INT;
        DECLARE @OldWorkDate DATE;
        DECLARE @OldStartTime TIME;
        DECLARE @OldEndTime TIME;
        DECLARE @ActiveAppointmentCount INT;

        SELECT
            @DoctorId = DoctorId,
            @OldRoomId = RoomId,
            @OldWorkDate = WorkDate,
            @OldStartTime = StartTime,
            @OldEndTime = EndTime
        FROM DoctorSchedules WITH (UPDLOCK, HOLDLOCK)
        WHERE ScheduleId = @ScheduleId;

        IF @DoctorId IS NULL
            THROW 50713, N'Lich lam viec khong ton tai.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM Rooms WHERE RoomId = @RoomId AND IsActive = 1
        )
            THROW 50704, N'Phong kham khong ton tai hoac da ngung hoat dong.', 1;

        SELECT @ActiveAppointmentCount = COUNT(1)
        FROM Appointments
        WHERE DoctorId = @DoctorId
          AND AppointmentDate = @OldWorkDate
          AND Status IN ('Scheduled', 'CheckedIn', 'InProgress')
          AND AppointmentTime >= @OldStartTime
          AND AppointmentTime < @OldEndTime;

        IF @ActiveAppointmentCount > 0
           AND (
                @IsActive = 0
                OR @RoomId <> ISNULL(@OldRoomId, -1)
                OR @WorkDate <> @OldWorkDate
                OR @StartTime <> @OldStartTime
                OR @EndTime <> @OldEndTime
                OR @MaxPatients < @ActiveAppointmentCount
           )
            THROW 50714, N'Khong the sua hoac tat lich vi da co lich hen active.', 1;

        IF @IsActive = 1 AND EXISTS (
            SELECT 1
            FROM DoctorSchedules WITH (UPDLOCK, HOLDLOCK)
            WHERE ScheduleId <> @ScheduleId
              AND DoctorId = @DoctorId
              AND WorkDate = @WorkDate
              AND IsActive = 1
              AND @StartTime < EndTime
              AND @EndTime > StartTime
        )
            THROW 50705, N'Trung lich lam viec cua bac si trong ngay nay.', 1;

        UPDATE DoctorSchedules
        SET
            RoomId = @RoomId,
            WorkDate = @WorkDate,
            StartTime = @StartTime,
            EndTime = @EndTime,
            MaxPatients = @MaxPatients,
            IsActive = @IsActive
        WHERE ScheduleId = @ScheduleId;

        COMMIT TRANSACTION;

        SELECT
            ds.ScheduleId,
            ds.DoctorId,
            u.FullName AS DoctorName,
            ds.RoomId,
            r.RoomName,
            ds.WorkDate,
            ds.StartTime,
            ds.EndTime,
            ds.MaxPatients,
            ds.IsActive,
            ds.CreatedAt,
            CAST(NULL AS DATETIME2) AS UpdatedAt
        FROM DoctorSchedules ds
        INNER JOIN Doctors d ON ds.DoctorId = d.DoctorId
        INNER JOIN Employees e ON d.EmployeeId = e.EmployeeId
        INNER JOIN Users u ON e.UserId = u.UserId
        LEFT JOIN Rooms r ON ds.RoomId = r.RoomId
        WHERE ds.ScheduleId = @ScheduleId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SetDoctorScheduleStatus
    @ScheduleId INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @DoctorId INT;
        DECLARE @WorkDate DATE;
        DECLARE @StartTime TIME;
        DECLARE @EndTime TIME;

        SELECT
            @DoctorId = DoctorId,
            @WorkDate = WorkDate,
            @StartTime = StartTime,
            @EndTime = EndTime
        FROM DoctorSchedules WITH (UPDLOCK, HOLDLOCK)
        WHERE ScheduleId = @ScheduleId;

        IF @DoctorId IS NULL
            THROW 50713, N'Lich lam viec khong ton tai.', 1;

        IF @IsActive = 0 AND EXISTS (
            SELECT 1
            FROM Appointments
            WHERE DoctorId = @DoctorId
              AND AppointmentDate = @WorkDate
              AND Status IN ('Scheduled', 'CheckedIn', 'InProgress')
              AND AppointmentTime >= @StartTime
              AND AppointmentTime < @EndTime
        )
            THROW 50714, N'Khong the tat lich vi da co lich hen active.', 1;

        IF @IsActive = 1 AND EXISTS (
            SELECT 1
            FROM DoctorSchedules WITH (UPDLOCK, HOLDLOCK)
            WHERE ScheduleId <> @ScheduleId
              AND DoctorId = @DoctorId
              AND WorkDate = @WorkDate
              AND IsActive = 1
              AND @StartTime < EndTime
              AND @EndTime > StartTime
        )
            THROW 50705, N'Trung lich lam viec cua bac si trong ngay nay.', 1;

        UPDATE DoctorSchedules
        SET IsActive = @IsActive
        WHERE ScheduleId = @ScheduleId;

        COMMIT TRANSACTION;

        SELECT
            ds.ScheduleId,
            ds.DoctorId,
            u.FullName AS DoctorName,
            ds.RoomId,
            r.RoomName,
            ds.WorkDate,
            ds.StartTime,
            ds.EndTime,
            ds.MaxPatients,
            ds.IsActive,
            ds.CreatedAt,
            CAST(NULL AS DATETIME2) AS UpdatedAt
        FROM DoctorSchedules ds
        INNER JOIN Doctors d ON ds.DoctorId = d.DoctorId
        INNER JOIN Employees e ON d.EmployeeId = e.EmployeeId
        INNER JOIN Users u ON e.UserId = u.UserId
        LEFT JOIN Rooms r ON ds.RoomId = r.RoomId
        WHERE ds.ScheduleId = @ScheduleId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* =========================================================
   Manager - Medicines database-first procedures
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_CreateMedicine
    @MedicineName NVARCHAR(150),
    @CategoryId INT,
    @Unit NVARCHAR(30),
    @Price DECIMAL(18,2),
    @StockQuantity INT,
    @MinStockQuantity INT,
    @IsActive BIT = 1,
    @CreatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @MedicineName IS NULL OR LTRIM(RTRIM(@MedicineName)) = N''
            THROW 50800, N'Ten thuoc la bat buoc.', 1;

        IF @CategoryId IS NULL OR NOT EXISTS (SELECT 1 FROM MedicineCategories WHERE CategoryId = @CategoryId)
            THROW 50801, N'Danh muc thuoc khong ton tai.', 1;

        IF @Unit IS NULL OR LTRIM(RTRIM(@Unit)) = N''
            THROW 50802, N'Don vi thuoc la bat buoc.', 1;

        IF @Price IS NULL OR @Price < 0
            THROW 50803, N'Gia thuoc khong duoc am.', 1;

        IF @StockQuantity IS NULL OR @StockQuantity < 0
            THROW 50804, N'Ton kho khong duoc am.', 1;

        IF @MinStockQuantity IS NULL OR @MinStockQuantity < 0
            THROW 50805, N'Ton toi thieu khong duoc am.', 1;

        IF @IsActive = 1 AND EXISTS (
            SELECT 1
            FROM Medicines WITH (UPDLOCK, HOLDLOCK)
            WHERE IsDeleted = 0
              AND IsActive = 1
              AND UPPER(MedicineName) = UPPER(@MedicineName)
        )
            THROW 50806, N'Ten thuoc active da ton tai.', 1;

        DECLARE @NewMedicine TABLE (MedicineId INT);

        INSERT INTO Medicines
            (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity, IsActive)
        OUTPUT inserted.MedicineId INTO @NewMedicine
        VALUES
            (@CategoryId, LTRIM(RTRIM(@MedicineName)), LTRIM(RTRIM(@Unit)), @Price, @StockQuantity, @MinStockQuantity, @IsActive);

        IF @StockQuantity > 0
        BEGIN
            INSERT INTO InventoryTransactions
                (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy)
            SELECT
                MedicineId,
                'IN',
                @StockQuantity,
                'InitialStock',
                NULL,
                N'Ton kho ban dau khi tao thuoc',
                @CreatedBy
            FROM @NewMedicine;
        END;

        COMMIT TRANSACTION;

        SELECT
            m.MedicineId,
            m.CategoryId,
            c.CategoryName,
            m.MedicineName,
            m.Unit,
            m.Price,
            m.StockQuantity,
            m.MinStockQuantity,
            m.IsActive,
            m.CreatedAt,
            m.UpdatedAt
        FROM Medicines m
        LEFT JOIN MedicineCategories c ON m.CategoryId = c.CategoryId
        WHERE m.MedicineId = (SELECT TOP 1 MedicineId FROM @NewMedicine);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateMedicine
    @MedicineId INT,
    @MedicineName NVARCHAR(150),
    @CategoryId INT,
    @Unit NVARCHAR(30),
    @Price DECIMAL(18,2),
    @MinStockQuantity INT,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM Medicines WITH (UPDLOCK, ROWLOCK)
            WHERE MedicineId = @MedicineId AND IsDeleted = 0
        )
            THROW 50807, N'Thuoc khong ton tai.', 1;

        IF @MedicineName IS NULL OR LTRIM(RTRIM(@MedicineName)) = N''
            THROW 50800, N'Ten thuoc la bat buoc.', 1;

        IF @CategoryId IS NULL OR NOT EXISTS (SELECT 1 FROM MedicineCategories WHERE CategoryId = @CategoryId)
            THROW 50801, N'Danh muc thuoc khong ton tai.', 1;

        IF @Unit IS NULL OR LTRIM(RTRIM(@Unit)) = N''
            THROW 50802, N'Don vi thuoc la bat buoc.', 1;

        IF @Price IS NULL OR @Price < 0
            THROW 50803, N'Gia thuoc khong duoc am.', 1;

        IF @MinStockQuantity IS NULL OR @MinStockQuantity < 0
            THROW 50805, N'Ton toi thieu khong duoc am.', 1;

        IF @IsActive = 1 AND EXISTS (
            SELECT 1
            FROM Medicines WITH (UPDLOCK, HOLDLOCK)
            WHERE MedicineId <> @MedicineId
              AND IsDeleted = 0
              AND IsActive = 1
              AND UPPER(MedicineName) = UPPER(@MedicineName)
        )
            THROW 50806, N'Ten thuoc active da ton tai.', 1;

        UPDATE Medicines
        SET
            MedicineName = LTRIM(RTRIM(@MedicineName)),
            CategoryId = @CategoryId,
            Unit = LTRIM(RTRIM(@Unit)),
            Price = @Price,
            MinStockQuantity = @MinStockQuantity,
            IsActive = @IsActive,
            UpdatedAt = SYSDATETIME()
        WHERE MedicineId = @MedicineId;

        COMMIT TRANSACTION;

        SELECT
            m.MedicineId,
            m.CategoryId,
            c.CategoryName,
            m.MedicineName,
            m.Unit,
            m.Price,
            m.StockQuantity,
            m.MinStockQuantity,
            m.IsActive,
            m.CreatedAt,
            m.UpdatedAt
        FROM Medicines m
        LEFT JOIN MedicineCategories c ON m.CategoryId = c.CategoryId
        WHERE m.MedicineId = @MedicineId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_AdjustMedicineStock
    @MedicineId INT,
    @Type NVARCHAR(20),
    @Quantity INT,
    @Note NVARCHAR(500) = NULL,
    @CreatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @OldStock INT;
        DECLARE @NewStock INT;

        SELECT @OldStock = StockQuantity
        FROM Medicines WITH (UPDLOCK, ROWLOCK)
        WHERE MedicineId = @MedicineId
          AND IsDeleted = 0;

        IF @OldStock IS NULL
            THROW 50807, N'Thuoc khong ton tai.', 1;

        SET @Type = UPPER(LTRIM(RTRIM(@Type)));

        IF @Type NOT IN ('IN', 'ADJUST')
            THROW 50808, N'Manager chi duoc nhap kho hoac dieu chinh kho.', 1;

        IF @Quantity IS NULL OR @Quantity <= 0
            THROW 50809, N'So luong phai lon hon 0.', 1;

        SET @NewStock = CASE
            WHEN @Type = 'IN' THEN @OldStock + @Quantity
            ELSE @Quantity
        END;

        IF @NewStock < 0
            THROW 50810, N'Ton kho khong duoc am.', 1;

        UPDATE Medicines
        SET
            StockQuantity = @NewStock,
            UpdatedAt = SYSDATETIME()
        WHERE MedicineId = @MedicineId;

        INSERT INTO InventoryTransactions
            (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy)
        VALUES
            (@MedicineId, @Type, @Quantity, 'ManagerAdjustment', NULL, @Note, @CreatedBy);

        COMMIT TRANSACTION;

        SELECT
            m.MedicineId,
            m.CategoryId,
            c.CategoryName,
            m.MedicineName,
            m.Unit,
            m.Price,
            m.StockQuantity,
            m.MinStockQuantity,
            m.IsActive,
            m.CreatedAt,
            m.UpdatedAt
        FROM Medicines m
        LEFT JOIN MedicineCategories c ON m.CategoryId = c.CategoryId
        WHERE m.MedicineId = @MedicineId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SetMedicineStatus
    @MedicineId INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM Medicines WITH (UPDLOCK, ROWLOCK)
            WHERE MedicineId = @MedicineId AND IsDeleted = 0
        )
            THROW 50807, N'Thuoc khong ton tai.', 1;

        UPDATE Medicines
        SET
            IsActive = @IsActive,
            UpdatedAt = SYSDATETIME()
        WHERE MedicineId = @MedicineId;

        COMMIT TRANSACTION;

        SELECT
            m.MedicineId,
            m.CategoryId,
            c.CategoryName,
            m.MedicineName,
            m.Unit,
            m.Price,
            m.StockQuantity,
            m.MinStockQuantity,
            m.IsActive,
            m.CreatedAt,
            m.UpdatedAt
        FROM Medicines m
        LEFT JOIN MedicineCategories c ON m.CategoryId = c.CategoryId
        WHERE m.MedicineId = @MedicineId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
