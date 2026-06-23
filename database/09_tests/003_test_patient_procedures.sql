USE ClinicManagementDB;
GO

DECLARE @NewPatientId INT;
DECLARE @NewMedicalRecordId INT;

EXEC dbo.sp_CreatePatient
    @UserId = NULL,
    @FullName = N'Lý Văn Test',
    @Gender = N'Nam',
    @DateOfBirth = '2000-12-12',
    @Phone = '0933333333',
    @Email = 'lyvantest@example.com',
    @Address = N'Quận 10, TP. Hồ Chí Minh',
    @HealthInsuranceNumber = 'BHYT003',
    @EmergencyContactName = N'Lý Văn Cha',
    @EmergencyContactPhone = '0966666666',
    @CreatedBy = 1,
    @NewPatientId = @NewPatientId OUTPUT,
    @NewMedicalRecordId = @NewMedicalRecordId OUTPUT;

SELECT 
    @NewPatientId AS NewPatientId,
    @NewMedicalRecordId AS NewMedicalRecordId;

EXEC dbo.sp_GetPatientById
    @PatientId = @NewPatientId;

EXEC dbo.sp_SearchPatients
    @Keyword = N'Test';

EXEC dbo.sp_UpdatePatient
    @PatientId = @NewPatientId,
    @FullName = N'Lý Văn Test Updated',
    @Gender = N'Nam',
    @DateOfBirth = '2000-12-12',
    @Phone = '0933333333',
    @Email = 'lyvantest_updated@example.com',
    @Address = N'Quận 5, TP. Hồ Chí Minh',
    @HealthInsuranceNumber = 'BHYT003-UPD',
    @EmergencyContactName = N'Lý Văn Cha',
    @EmergencyContactPhone = '0966666666',
    @UpdatedBy = 1;

EXEC dbo.sp_GetPatientById
    @PatientId = @NewPatientId;
GO