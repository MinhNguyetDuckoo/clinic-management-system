USE ClinicManagementDB;
GO

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @DoctorId INT;

SELECT TOP 1 @DoctorId = DoctorId
FROM Doctors
ORDER BY DoctorId;

SELECT dbo.fn_CalculateAge('2001-04-10') AS Age;

SELECT dbo.fn_GetMedicineStock(1) AS MedicineStock;

SELECT dbo.fn_IsMedicineStockEnough(1, 10) AS IsEnoughStock;

SELECT dbo.fn_CalculateInvoiceTotal(1) AS InvoiceTotal;

SELECT dbo.fn_IsDoctorWorking(@DoctorId, @Today, '08:00') AS IsDoctorWorking_08h;

SELECT dbo.fn_CheckDoctorAvailable(@DoctorId, @Today, '08:00') AS IsDoctorAvailable_08h;

SELECT dbo.fn_CheckDoctorAvailable(@DoctorId, @Today, '10:00') AS IsDoctorAvailable_10h;

SELECT dbo.fn_GenerateNextPatientCode() AS NextPatientCode;

SELECT dbo.fn_GenerateNextMedicalRecordCode() AS NextMedicalRecordCode;
GO