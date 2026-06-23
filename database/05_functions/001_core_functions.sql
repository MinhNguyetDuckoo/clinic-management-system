USE ClinicManagementDB;
GO

/* =========================================================
   001_core_functions.sql
   Các function dùng chung cho hệ thống phòng khám
   ========================================================= */


/* =========================================================
   1. Tính tuổi từ ngày sinh
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_CalculateAge
(
    @DateOfBirth DATE
)
RETURNS INT
AS
BEGIN
    DECLARE @Age INT;

    IF @DateOfBirth IS NULL
        RETURN NULL;

    SET @Age = DATEDIFF(YEAR, @DateOfBirth, CAST(GETDATE() AS DATE));

    IF DATEADD(YEAR, @Age, @DateOfBirth) > CAST(GETDATE() AS DATE)
        SET @Age = @Age - 1;

    RETURN @Age;
END;
GO


/* =========================================================
   2. Lấy tồn kho hiện tại của thuốc
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_GetMedicineStock
(
    @MedicineId INT
)
RETURNS INT
AS
BEGIN
    DECLARE @Stock INT;

    SELECT @Stock = StockQuantity
    FROM Medicines
    WHERE MedicineId = @MedicineId
      AND IsDeleted = 0
      AND IsActive = 1;

    RETURN ISNULL(@Stock, 0);
END;
GO


/* =========================================================
   3. Kiểm tra thuốc có đủ tồn kho không
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_IsMedicineStockEnough
(
    @MedicineId INT,
    @RequiredQuantity INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 0;
    DECLARE @Stock INT;

    SELECT @Stock = StockQuantity
    FROM Medicines
    WHERE MedicineId = @MedicineId
      AND IsDeleted = 0
      AND IsActive = 1;

    IF ISNULL(@Stock, 0) >= @RequiredQuantity
        SET @Result = 1;

    RETURN @Result;
END;
GO


/* =========================================================
   4. Tính tổng tiền hóa đơn
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_CalculateInvoiceTotal
(
    @InvoiceId INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @Total DECIMAL(18,2);

    SELECT @Total = SUM(Amount)
    FROM InvoiceDetails
    WHERE InvoiceId = @InvoiceId;

    RETURN ISNULL(@Total, 0);
END;
GO


/* =========================================================
   5. Kiểm tra bác sĩ có lịch làm việc không
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_IsDoctorWorking
(
    @DoctorId INT,
    @AppointmentDate DATE,
    @AppointmentTime TIME
)
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM DoctorSchedules
        WHERE DoctorId = @DoctorId
          AND WorkDate = @AppointmentDate
          AND @AppointmentTime >= StartTime
          AND @AppointmentTime < EndTime
          AND IsActive = 1
    )
    BEGIN
        SET @Result = 1;
    END;

    RETURN @Result;
END;
GO


/* =========================================================
   6. Kiểm tra bác sĩ có trống lịch không
   Lưu ý:
   Function này dùng để kiểm tra nhanh.
   Khi đặt lịch thật vẫn phải kiểm tra lại trong Stored Procedure.
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_CheckDoctorAvailable
(
    @DoctorId INT,
    @AppointmentDate DATE,
    @AppointmentTime TIME
)
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 0;

    IF dbo.fn_IsDoctorWorking(@DoctorId, @AppointmentDate, @AppointmentTime) = 0
        RETURN 0;

    IF NOT EXISTS (
        SELECT 1
        FROM Appointments
        WHERE DoctorId = @DoctorId
          AND AppointmentDate = @AppointmentDate
          AND AppointmentTime = @AppointmentTime
          AND Status <> 'Cancelled'
          AND Status <> 'NoShow'
    )
    BEGIN
        SET @Result = 1;
    END;

    RETURN @Result;
END;
GO


/* =========================================================
   7. Tạo mã bệnh nhân tiếp theo
   Ví dụ: PAT001, PAT002, PAT003
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_GenerateNextPatientCode()
RETURNS NVARCHAR(30)
AS
BEGIN
    DECLARE @NextNumber INT;

    SELECT @NextNumber = ISNULL(MAX(TRY_CAST(SUBSTRING(PatientCode, 4, 20) AS INT)), 0) + 1
    FROM Patients
    WHERE PatientCode LIKE 'PAT%';

    RETURN 'PAT' + RIGHT('000' + CAST(@NextNumber AS NVARCHAR(10)), 3);
END;
GO


/* =========================================================
   8. Tạo mã hồ sơ bệnh án tiếp theo
   Ví dụ: MR001, MR002, MR003
   ========================================================= */
CREATE OR ALTER FUNCTION dbo.fn_GenerateNextMedicalRecordCode()
RETURNS NVARCHAR(30)
AS
BEGIN
    DECLARE @NextNumber INT;

    SELECT @NextNumber = ISNULL(MAX(TRY_CAST(SUBSTRING(RecordCode, 3, 20) AS INT)), 0) + 1
    FROM MedicalRecords
    WHERE RecordCode LIKE 'MR%';

    RETURN 'MR' + RIGHT('000' + CAST(@NextNumber AS NVARCHAR(10)), 3);
END;
GO