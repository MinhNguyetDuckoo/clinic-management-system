-- SESSION A (TIẾP TÂN A): Phantom Read (Lỗi đọc bóng ma)
-- Kịch bản (Slide): Tiếp tân A đang tính toán báo cáo số lượng lịch hẹn của Bác sĩ.
-- Lần 1 đếm được 5 lịch hẹn. Hệ thống xử lý chậm 10s.
-- Lần 2 chốt số lượng trước khi đóng Transaction thì bất ngờ lòi ra 6 lịch hẹn!

USE ClinicManagementDB;
GO

-- Hạ mức cô lập xuống REPEATABLE READ (mức này khóa dòng nhưng KHÔNG khóa thêm dòng mới - cho phép Phantom Read xảy ra)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
GO

BEGIN TRAN;

    DECLARE @Count1 INT;
    DECLARE @DoctorId INT = 2; -- Giả sử đang báo cáo cho Bác sĩ ID = 2
    DECLARE @Today DATE = CAST(SYSDATETIME() AS DATE);

    -- Bước 1 (Đọc lần 1): Tiếp tân A đếm số lượng lịch hẹn
    SELECT @Count1 = COUNT(*) 
    FROM Appointments 
    WHERE DoctorId = @DoctorId AND AppointmentDate = @Today;

    PRINT N'=================================================';
    PRINT N'[BƯỚC 1] Cửa sổ 1 - Tiếp tân A bấm nút "Báo cáo lịch hẹn".';
    PRINT N'>> Lần đọc 1: Đếm được ' + CAST(@Count1 AS NVARCHAR(10)) + N' bệnh nhân.';
    PRINT N'=================================================';
    PRINT N'>>> Hệ thống đang xử lý nội bộ phức tạp (WAITFOR DELAY 10 giây)...';
    PRINT N'>>> (Hãy sang cửa sổ Session B và chạy lệnh chèn dữ liệu ngay bây giờ!)';
    
    -- Bước 2: Hệ thống xử lý và Delay 10s
    WAITFOR DELAY '00:00:10';

    -- Bước 4 (Đọc lần 2): Tiếp tân A đếm lại lần cuối để chốt báo cáo
    DECLARE @Count2 INT;
    
    SELECT @Count2 = COUNT(*) 
    FROM Appointments 
    WHERE DoctorId = @DoctorId AND AppointmentDate = @Today;

    PRINT N'';
    PRINT N'=================================================';
    PRINT N'[BƯỚC 4] Cửa sổ 1 - Chốt báo cáo sau 10 giây delay.';
    
    IF (@Count1 <> @Count2)
    BEGIN
        PRINT N'>> ❌ HẬU QUẢ: XUẤT HIỆN BỆNH NHÂN BÓNG MA!';
        PRINT N'>> Lần đọc 1: ' + CAST(@Count1 AS NVARCHAR(10)) + N' bệnh nhân. Lần đọc 2: ' + CAST(@Count2 AS NVARCHAR(10)) + N' bệnh nhân.';
        PRINT N'>> Sự xuất hiện bất ngờ của lịch hẹn thứ ' + CAST(@Count2 AS NVARCHAR(10)) + N' làm sai lệch logic báo cáo!';
    END
    ELSE
    BEGIN
        PRINT N'>> ✅ Báo cáo chuẩn xác: ' + CAST(@Count2 AS NVARCHAR(10)) + N' bệnh nhân.';
    END
    PRINT N'=================================================';

COMMIT TRAN;
GO
