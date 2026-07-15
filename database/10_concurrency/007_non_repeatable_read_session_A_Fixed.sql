-- SESSION A (THU NGÂN): Đã khắc phục lỗi Non-Repeatable Read
-- Kịch bản (Slide): Thu ngân đang mở hóa đơn thanh toán, đọc giá Chụp X-Quang là 200k. 
-- Bằng cách sử dụng REPEATABLE READ, hệ thống sẽ KHÓA dòng dữ liệu này lại,
-- cấm không cho Admin (Session B) sửa giá cho đến khi Thu ngân chốt xong hóa đơn!

USE ClinicManagementDB;
GO

-- KHẮC PHỤC LỖI: Nâng mức độ cô lập lên REPEATABLE READ
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
GO

BEGIN TRAN;

    DECLARE @CurrentPrice DECIMAL(18,2);
    DECLARE @ServiceName NVARCHAR(100);

    -- Bước 1 (Đọc lần 1): Thu ngân đọc phôi tạm tính
    SELECT @CurrentPrice = Price, @ServiceName = ServiceName
    FROM Services 
    WHERE ServiceId = 3; 

    PRINT N'=================================================';
    PRINT N'[BƯỚC 1] Thu ngân mở giao diện thanh toán (ĐÃ DÙNG KHÓA BẢO VỆ).';
    PRINT N'>> Phôi in tạm tính cho dịch vụ "' + @ServiceName + N'" là: ' + CAST(@CurrentPrice AS NVARCHAR(50)) + N' VNĐ';
    PRINT N'=================================================';
    PRINT N'>>> Đang chờ Thu ngân kiểm tra và bấm Xác nhận (Delay 10 giây)...';
    PRINT N'>>> (Hãy sang cửa sổ Session B chạy lệnh thử xem Admin có sửa được giá không nhé!)';
    
    -- Giả lập độ trễ 10 giây
    WAITFOR DELAY '00:00:10';

    -- Bước 3 (Đọc lần 2): Thu ngân bấm Xác nhận
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
    END
    ELSE
    BEGIN
        PRINT N'>> ✅ THÀNH CÔNG! Hóa đơn được chốt đúng với giá phôi tạm tính: ' + CAST(@NewPrice AS NVARCHAR(50)) + N' VNĐ.';
        PRINT N'>> Hệ thống đã ngăn chặn thành công việc Admin đổi giá giữa chừng!';
    END
    PRINT N'=================================================';

COMMIT TRAN;
GO

-- TRẢ LẠI GIÁ GỐC ĐỂ TEST LẦN SAU
UPDATE Services SET Price = 200000 WHERE ServiceId = 3;
GO
