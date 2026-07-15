-- SESSION A (TIẾP TÂN A): Đã khắc phục lỗi Phantom Read
-- Kịch bản (Slide): Bằng cách nâng mức cô lập lên SERIALIZABLE,
-- SQL Server sẽ khóa nguyên cả MỘT KHOẢNG (Range Lock) theo điều kiện WHERE,
-- ngăn chặn tuyệt đối việc Tiếp tân B chèn thêm lịch hẹn mới lọt vào khoảng đếm của A.

USE ClinicManagementDB;
GO

-- KHẮC PHỤC LỖI: Nâng mức độ cô lập lên SERIALIZABLE
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
GO

BEGIN TRAN;

    DECLARE @Count1 INT;
    DECLARE @DoctorId INT = 2; 
    DECLARE @Today DATE = CAST(SYSDATETIME() AS DATE);

    -- Bước 1 (Đọc lần 1): Tiếp tân A đếm số lượng lịch hẹn
    SELECT @Count1 = COUNT(*) 
    FROM Appointments 
    WHERE DoctorId = @DoctorId AND AppointmentDate = @Today;

    PRINT N'=================================================';
    PRINT N'[BƯỚC 1] Cửa sổ 1 - Tiếp tân A đếm lịch hẹn (ĐÃ BẬT BẢO VỆ SERIALIZABLE).';
    PRINT N'>> Lần đọc 1: Đếm được ' + CAST(@Count1 AS NVARCHAR(10)) + N' bệnh nhân.';
    PRINT N'=================================================';
    PRINT N'>>> Hệ thống đang xử lý nội bộ phức tạp (WAITFOR DELAY 10 giây)...';
    PRINT N'>>> (Hãy sang cửa sổ Session B chạy lệnh chèn, bạn sẽ thấy B bị treo!)';
    
    -- Giả lập độ trễ 10 giây
    WAITFOR DELAY '00:00:10';

    -- Bước 4 (Đọc lần 2)
    DECLARE @Count2 INT;
    
    SELECT @Count2 = COUNT(*) 
    FROM Appointments 
    WHERE DoctorId = @DoctorId AND AppointmentDate = @Today;

    PRINT N'';
    PRINT N'=================================================';
    PRINT N'[BƯỚC 4] Cửa sổ 1 - Chốt báo cáo sau 10 giây delay.';
    
    IF (@Count1 <> @Count2)
    BEGIN
        PRINT N'>> ❌ CẢNH BÁO LỖI PHANTOM READ!';
    END
    ELSE
    BEGIN
        PRINT N'>> ✅ THÀNH CÔNG! Báo cáo chuẩn xác tuyệt đối: ' + CAST(@Count2 AS NVARCHAR(10)) + N' bệnh nhân.';
        PRINT N'>> Mức SERIALIZABLE đã ngăn chặn thành công bệnh nhân "bóng ma" chèn ngang!';
    END
    PRINT N'=================================================';

COMMIT TRAN;
GO

-- TRẢ LẠI DỮ LIỆU ĐỂ TEST LẦN SAU (Xóa các lịch hẹn vừa bị chèn thêm trong hôm nay của Bác sĩ 2)
-- DELETE FROM Appointments WHERE DoctorId = 2 AND AppointmentDate = CAST(SYSDATETIME() AS DATE) AND Status = 'Scheduled';
-- GO
