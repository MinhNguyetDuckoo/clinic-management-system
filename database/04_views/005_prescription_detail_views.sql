USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_PrescriptionDetails
AS
SELECT
    pr.PrescriptionId,
    pr.Status AS PrescriptionStatus,

    pd.PrescriptionDetailId,
    pd.MedicineId,
    m.MedicineName,
    m.Unit,
    m.Price,
    m.StockQuantity,
    pd.Quantity,
    pd.Dosage,
    pd.UsageInstruction,

    CASE 
        WHEN m.StockQuantity >= pd.Quantity THEN CAST(1 AS BIT)
        ELSE CAST(0 AS BIT)
    END AS IsEnoughStock
FROM PrescriptionDetails pd
INNER JOIN Prescriptions pr 
    ON pd.PrescriptionId = pr.PrescriptionId
INNER JOIN Medicines m 
    ON pd.MedicineId = m.MedicineId;
GO