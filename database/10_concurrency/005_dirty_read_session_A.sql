USE ClinicManagementDB;
GO

/*
    DIRTY READ - SESSION A
    
    Cách demo:
    1. Mở cửa sổ query A, chạy file này.
    2. Ngay khi thấy WAITFOR đang chờ, mở cửa sổ query B và chạy session B.
*/

BEGIN TRANSACTION;
PRINT 'Session A: Update Medicine price...';

-- Cập nhật giá thuốc nhưng chưa COMMIT ngay
UPDATE Medicines
SET Price = 999999
WHERE MedicineId = 1;

PRINT 'Session A: Wait 10 seconds before rollback...';
-- Giả lập xử lý lâu để Session B có thời gian đọc dữ liệu
WAITFOR DELAY '00:00:10';

PRINT 'Session A: Rollback transaction...';
-- Hủy bỏ giao dịch, giá thuốc trở về như cũ
ROLLBACK TRANSACTION;

PRINT 'Session A: Finished!';
GO
