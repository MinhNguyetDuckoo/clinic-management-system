USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Reset tồn kho Paracetamol về 100 để demo dễ nhìn
UPDATE Medicines
SET StockQuantity = 100
WHERE MedicineId = 1;

SELECT 
    MedicineId,
    MedicineName,
    StockQuantity
FROM Medicines
WHERE MedicineId = 1;
GO