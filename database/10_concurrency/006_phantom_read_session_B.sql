-- SESSION B (TIẾP TÂN B): Phantom Read (Lỗi đọc bóng ma)
-- Kịch bản (Slide): Trong 10 giây delay của Cửa sổ 1, Tiếp tân B ở Cửa sổ 2 thao tác nhanh,
-- chèn thành công 1 lịch hẹn mới cho cùng Bác sĩ và COMMIT lập tức.

USE ClinicManagementDB;
GO

BEGIN TRAN;

    PRINT N'=================================================';
    PRINT N'[BƯỚC 3] Cửa sổ 2 - Tiếp tân B đang tạo lịch hẹn (nhanh)...';
    
    DECLARE @DoctorId INT = 2; -- Phải trùng với DoctorId mà Session A đang đếm
    DECLARE @Today DATE = CAST(SYSDATETIME() AS DATE);
    DECLARE @PatientId INT;

    -- Lấy ngẫu nhiên 1 bệnh nhân có sẵn
    SELECT TOP 1 @PatientId = PatientId FROM Patients;

    -- Chèn lịch hẹn mới (tạo ra "bóng ma")
    INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, AppointmentTime, Status)
    VALUES (@PatientId, @DoctorId, @Today, '08:00:00', 'Scheduled');

    PRINT N'>> ✅ Đã chèn thành công 1 lịch hẹn mới cho Bác sĩ ID = 2!';
    PRINT N'=================================================';

COMMIT TRAN;
GO
