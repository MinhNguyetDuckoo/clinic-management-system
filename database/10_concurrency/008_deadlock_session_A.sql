USE ClinicManagementDB;
GO

/*
    DEADLOCK - SESSION A
    
    Cách demo:
    1. Mở cửa sổ query A và B.
    2. Chạy Session A, ngay sau đó chuyển sang tab B và chạy Session B.
*/

BEGIN TRANSACTION;

PRINT 'Session A: Đang khóa MedicineId = 1...';
-- Khóa dòng dữ liệu MedicineId = 1
UPDATE Medicines
SET StockQuantity = StockQuantity - 1
WHERE MedicineId = 1;

PRINT 'Session A: Chờ 5 giây để Session B có thời gian khóa MedicineId = 2...';
WAITFOR DELAY '00:00:05';

PRINT 'Session A: Đang thử khóa MedicineId = 2 (Có thể sẽ bị Deadlock tại đây)...';
-- Thử khóa dòng dữ liệu MedicineId = 2 đang bị Session B giữ
UPDATE Medicines
SET StockQuantity = StockQuantity - 1
WHERE MedicineId = 2;

COMMIT TRANSACTION;
PRINT 'Session A: Hoàn tất!';
GO
