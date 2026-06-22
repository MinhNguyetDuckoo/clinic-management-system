USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_Receptionist_TodayAppointments
AS
SELECT
    a.AppointmentId,
    a.AppointmentDate,
    a.AppointmentTime,
    a.Status,
    a.Reason,

    p.PatientId,
    p.PatientCode,
    p.FullName AS PatientName,
    p.Phone AS PatientPhone,
    p.Gender AS PatientGender,
    p.DateOfBirth AS PatientDateOfBirth,

    d.DoctorId,
    u.FullName AS DoctorName,
    s.SpecialtyName,

    r.RoomId,
    r.RoomName,

    a.CreatedAt
FROM Appointments a
INNER JOIN Patients p 
    ON a.PatientId = p.PatientId
INNER JOIN Doctors d 
    ON a.DoctorId = d.DoctorId
INNER JOIN Employees e 
    ON d.EmployeeId = e.EmployeeId
INNER JOIN Users u 
    ON e.UserId = u.UserId
INNER JOIN Specialties s 
    ON d.SpecialtyId = s.SpecialtyId
LEFT JOIN Rooms r 
    ON a.RoomId = r.RoomId
WHERE a.AppointmentDate = CAST(GETDATE() AS DATE)
  AND a.Status <> 'Cancelled';
GO