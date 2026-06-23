USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_Doctor_TodayQueue
AS
SELECT
    ex.ExaminationId,
    ex.Status AS ExaminationStatus,
    ex.Symptoms,
    ex.Diagnosis,
    ex.Conclusion,
    ex.StartedAt,
    ex.FinishedAt,

    a.AppointmentId,
    a.AppointmentDate,
    a.AppointmentTime,
    a.Status AS AppointmentStatus,
    ex.Status AS Status,
    a.Reason,

    p.PatientId,
    p.PatientCode,
    p.FullName AS PatientName,
    p.Gender,
    p.DateOfBirth,
    p.Phone,

    d.DoctorId,
    du.FullName AS DoctorName,

    r.RoomName,

    mr.MedicalRecordId,
    mr.RecordCode
FROM Examinations ex
INNER JOIN Appointments a 
    ON ex.AppointmentId = a.AppointmentId
LEFT JOIN Rooms r
    ON a.RoomId = r.RoomId
INNER JOIN Patients p 
    ON a.PatientId = p.PatientId
INNER JOIN Doctors d 
    ON ex.DoctorId = d.DoctorId
INNER JOIN Employees de 
    ON d.EmployeeId = de.EmployeeId
INNER JOIN Users du 
    ON de.UserId = du.UserId
INNER JOIN MedicalRecords mr 
    ON ex.MedicalRecordId = mr.MedicalRecordId
WHERE a.AppointmentDate = CAST(GETDATE() AS DATE)
  AND ex.Status IN ('Waiting', 'InProgress');
GO
