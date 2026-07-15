USE ClinicManagementDB;
GO

/*
    DIRTY READ - SESSION B
    
    Cách demo:
    1. Chạy Session A trước.
    2. Chạy file này ngay lập tức.
*/

-- Sử dụng mức cô lập READ UNCOMMITTED để cho phép Dirty Read
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

BEGIN TRANSACTION;
PRINT 'Session B: Read Medicine price (ALLOW DIRTY READ)...';

-- Đọc giá thuốc, có thể sẽ đọc phải giá 999999 do Session A chưa Rollback
SELECT 
    MedicineId,
    MedicineName,
    Price AS ReadPrice
FROM Medicines
WHERE MedicineId = 1;

PRINT 'Session B: Finish read!';
COMMIT TRANSACTION;
GO
