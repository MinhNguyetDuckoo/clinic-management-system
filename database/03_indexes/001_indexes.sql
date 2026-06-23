USE ClinicManagementDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE INDEX IX_Users_Username
ON Users(Username);
GO

CREATE INDEX IX_Patients_Phone
ON Patients(Phone);
GO

CREATE INDEX IX_Patients_FullName
ON Patients(FullName);
GO

CREATE INDEX IX_Appointments_Date_Doctor
ON Appointments(AppointmentDate, DoctorId);
GO

CREATE INDEX IX_Appointments_Patient
ON Appointments(PatientId);
GO

CREATE UNIQUE INDEX UX_Appointments_Doctor_Date_Time_Active
ON Appointments(DoctorId, AppointmentDate, AppointmentTime)
WHERE Status <> 'Cancelled' AND Status <> 'NoShow';
GO

CREATE INDEX IX_Examinations_Doctor_Status
ON Examinations(DoctorId, Status);
GO

CREATE INDEX IX_Prescriptions_Status
ON Prescriptions(Status);
GO

CREATE INDEX IX_Invoices_Status
ON Invoices(Status);
GO

CREATE INDEX IX_Medicines_Stock
ON Medicines(StockQuantity);
GO