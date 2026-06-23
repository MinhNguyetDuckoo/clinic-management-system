USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_Manager_RevenueByDay
AS
SELECT
    CAST(p.PaidAt AS DATE) AS RevenueDate,
    COUNT(DISTINCT p.InvoiceId) AS TotalPaidInvoices,
    SUM(p.Amount) AS TotalRevenue
FROM Payments p
GROUP BY CAST(p.PaidAt AS DATE);
GO

CREATE OR ALTER VIEW vw_Manager_MedicineStockStatus
AS
SELECT
    m.MedicineId,
    m.MedicineName,
    m.Unit,
    m.StockQuantity,
    m.MinStockQuantity,
    m.Price,
    c.CategoryName,
    CASE
        WHEN m.StockQuantity = 0 THEN 'OutOfStock'
        WHEN m.StockQuantity <= m.MinStockQuantity THEN 'LowStock'
        ELSE 'Normal'
    END AS StockStatus
FROM Medicines m
LEFT JOIN MedicineCategories c 
    ON m.CategoryId = c.CategoryId
WHERE m.IsDeleted = 0;
GO