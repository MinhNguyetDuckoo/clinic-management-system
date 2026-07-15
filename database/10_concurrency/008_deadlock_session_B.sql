USE ClinicManagementDB;
GO

/*
    DEADLOCK - SESSION B
    
    Cách demo:
    1. Mở cửa sổ query A và B.
    2. Chạy Session A, ngay sau đó chuyển sang tab B và chạy Session B.
*/

BEGIN TRANSACTION;

PRINT 'Session B: Đang khóa MedicineId = 2...';
-- Khóa dòng dữ liệu MedicineId = 2
UPDATE Medicines
SET StockQuantity = StockQuantity - 1
WHERE MedicineId = 2;

PRINT 'Session B: Chờ 5 giây để Session A có thời gian khóa MedicineId = 1...';
WAITFOR DELAY '00:00:05';

PRINT 'Session B: Đang thử khóa MedicineId = 1 (Có thể sẽ bị Deadlock tại đây)...';
-- Thử khóa dòng dữ liệu MedicineId = 1 đang bị Session A giữ
UPDATE Medicines
SET StockQuantity = StockQuantity - 1
WHERE MedicineId = 1;

COMMIT TRANSACTION;
PRINT 'Session B: Hoàn tất!';
GO
