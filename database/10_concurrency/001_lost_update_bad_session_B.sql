USE ClinicManagementDB;
GO

/*
    LOST UPDATE - SESSION B

    Chạy file này trong khi Session A đang WAITFOR.
*/

DECLARE @Stock INT;

BEGIN TRANSACTION;

SELECT @Stock = StockQuantity
FROM Medicines
WHERE MedicineId = 1;

PRINT 'Session B read stock = ' + CAST(@Stock AS NVARCHAR(20));

-- Session B trừ 20 viên dựa trên giá trị đã đọc ban đầu
UPDATE Medicines
SET StockQuantity = @Stock - 20
WHERE MedicineId = 1;

PRINT 'Session B update stock to ' + CAST(@Stock - 20 AS NVARCHAR(20));

COMMIT TRANSACTION;

SELECT 
    MedicineId,
    MedicineName,
    StockQuantity AS FinalStock_B
FROM Medicines
WHERE MedicineId = 1;
GO