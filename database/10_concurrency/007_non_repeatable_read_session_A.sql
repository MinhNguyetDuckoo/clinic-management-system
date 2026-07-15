-- SESSION A (THU NGÂN): Non-Repeatable Read (Lỗi đọc không thể lặp lại)
-- Kịch bản (Slide): Thu ngân đang mở hóa đơn thanh toán, đọc giá Chụp X-Quang là 200k. 
-- Trong lúc chờ Thu ngân bấm xác nhận, Admin (Session B) vào đổi giá thành 250k.
-- Thu ngân bấm xác nhận, hệ thống đọc lại giá để chốt thì bị nhảy thành 250k.

USE ClinicManagementDB;
GO

-- Cố tình hạ mức độ cô lập xuống READ COMMITTED để sinh ra lỗi
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
GO

BEGIN TRAN;

    DECLARE @CurrentPrice DECIMAL(18,2);
    DECLARE @ServiceName NVARCHAR(100);

    -- Bước 1 (Đọc lần 1): Thu ngân đọc phôi tạm tính
    SELECT @CurrentPrice = Price, @ServiceName = ServiceName
    FROM Services 
    WHERE ServiceId = 3; -- ID 3 giả định là Chụp X-Quang

    PRINT N'=================================================';
    PRINT N'[BƯỚC 1] Thu ngân mở giao diện thanh toán.';
    PRINT N'>> Phôi in tạm tính cho dịch vụ "' + @ServiceName + N'" là: ' + CAST(@CurrentPrice AS NVARCHAR(50)) + N' VNĐ';
    PRINT N'=================================================';
    PRINT N'>>> Đang chờ Thu ngân kiểm tra và bấm Xác nhận (Delay 10 giây)...';
    PRINT N'>>> (Hãy sang cửa sổ Session B và chạy lệnh ngay bây giờ!)';
    
    -- Giả lập độ trễ 10 giây để Admin có thời gian đổi giá bên Session B
    WAITFOR DELAY '00:00:10';

    -- Bước 3 (Đọc lần 2): Thu ngân bấm Xác nhận, hệ thống quét lại giá cơ sở để chốt
    DECLARE @NewPrice DECIMAL(18,2);
    
    SELECT @NewPrice = Price 
    FROM Services 
    WHERE ServiceId = 3;

    PRINT N'';
    PRINT N'=================================================';
    PRINT N'[BƯỚC 3] Thu ngân bấm Xác nhận chốt hóa đơn.';
    
    IF (@CurrentPrice <> @NewPrice)
    BEGIN
        PRINT N'>> ❌ CẢNH BÁO LỖI NON-REPEATABLE READ!';
        PRINT N'>> Giá dịch vụ đã bị nhảy từ ' + CAST(@CurrentPrice AS NVARCHAR(50)) + N' lên thành ' + CAST(@NewPrice AS NVARCHAR(50)) + N' VNĐ.';
        PRINT N'>> Khách hàng phàn nàn vì hóa đơn chính thức khác với phôi tạm tính!';
    END
    ELSE
    BEGIN
        PRINT N'>> ✅ Hóa đơn được chốt thành công với giá: ' + CAST(@NewPrice AS NVARCHAR(50)) + N' VNĐ.';
    END
    PRINT N'=================================================';

COMMIT TRAN;
GO
