USE ClinicManagementDB;
GO

/*
    LOST UPDATE - SESSION A

    Cách demo:
    1. Chạy file prepare trước.
    2. Mở cửa sổ query A, chạy file này.
    3. Ngay khi thấy WAITFOR đang chờ, mở cửa sổ query B và chạy session B.
*/

DECLARE @Stock INT;

BEGIN TRANSACTION;

SELECT @Stock = StockQuantity
FROM Medicines
WHERE MedicineId = 1;

PRINT 'Session A read stock = ' + CAST(@Stock AS NVARCHAR(20));

-- Giả lập xử lý lâu
WAITFOR DELAY '00:00:10';

-- Session A trừ 10 viên dựa trên giá trị đã đọc ban đầu
UPDATE Medicines
SET StockQuantity = @Stock - 10
WHERE MedicineId = 1;

PRINT 'Session A update stock to ' + CAST(@Stock - 10 AS NVARCHAR(20));

COMMIT TRANSACTION;

SELECT 
    MedicineId,
    MedicineName,
    StockQuantity AS FinalStock_A
FROM Medicines
WHERE MedicineId = 1;
GO