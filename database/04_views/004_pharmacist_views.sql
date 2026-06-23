USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_Pharmacist_PendingPrescriptions
AS
SELECT
    pr.PrescriptionId,
    pr.ExaminationId,
    pr.Status,
    pr.CreatedAt,

    p.PatientId,
    p.PatientCode,
    p.FullName AS PatientName,
    p.Phone AS PatientPhone,

    d.DoctorId,
    du.FullName AS DoctorName,

    COUNT(pd.PrescriptionDetailId) AS TotalMedicineItems
FROM Prescriptions pr
INNER JOIN Examinations ex 
    ON pr.ExaminationId = ex.ExaminationId
INNER JOIN Appointments a 
    ON ex.AppointmentId = a.AppointmentId
INNER JOIN Patients p 
    ON a.PatientId = p.PatientId
INNER JOIN Doctors d 
    ON pr.DoctorId = d.DoctorId
INNER JOIN Employees de 
    ON d.EmployeeId = de.EmployeeId
INNER JOIN Users du 
    ON de.UserId = du.UserId
LEFT JOIN PrescriptionDetails pd 
    ON pr.PrescriptionId = pd.PrescriptionId
WHERE pr.Status = 'Pending'
GROUP BY
    pr.PrescriptionId,
    pr.ExaminationId,
    pr.Status,
    pr.CreatedAt,
    p.PatientId,
    p.PatientCode,
    p.FullName,
    p.Phone,
    d.DoctorId,
    du.FullName;
GO