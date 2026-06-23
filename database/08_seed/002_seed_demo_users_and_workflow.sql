USE ClinicManagementDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   002_seed_demo_users_and_workflow.sql
   Seed dữ liệu demo để test View theo từng role
   ========================================================= */

BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================
       1. Tạo Users demo
       PasswordHash tạm để demo.
       Sau này backend sẽ hash bằng bcrypt.
       ========================= */

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('admin', 'demo_hash_123', N'Nguyễn Admin', 'admin@clinic.local', '0900000001');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'letan')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('letan', 'demo_hash_123', N'Trần Lễ Tân', 'letan@clinic.local', '0900000002');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'bacsi')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('bacsi', 'demo_hash_123', N'Lê Bác Sĩ', 'bacsi@clinic.local', '0900000003');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'bacsi_nhi')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('bacsi_nhi', 'demo_hash_123', N'Nguyen Bac Si Nhi', 'bacsi.nhi@clinic.local', '0900000007');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'bacsi_tmh')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('bacsi_tmh', 'demo_hash_123', N'Tran Bac Si TMH', 'bacsi.tmh@clinic.local', '0900000008');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'bacsi_dalieu')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('bacsi_dalieu', 'demo_hash_123', N'Pham Bac Si Da Lieu', 'bacsi.dalieu@clinic.local', '0900000009');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'bacsi_dem2')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('bacsi_dem2', '123456', N'Bac Si Test Ca Dem 2', 'bacsi.dem2@clinic.local', '0900000010');
    END

    UPDATE Users
    SET FullName = N'Nguyen Bac Si Nhi'
    WHERE Username = 'bacsi_nhi';

    UPDATE Users
    SET FullName = N'Tran Bac Si TMH'
    WHERE Username = 'bacsi_tmh';

    UPDATE Users
    SET FullName = N'Pham Bac Si Da Lieu'
    WHERE Username = 'bacsi_dalieu';

    UPDATE Users
    SET
        PasswordHash = '123456',
        FullName = N'Bac Si Test Ca Dem 2',
        IsActive = 1,
        IsDeleted = 0
    WHERE Username = 'bacsi_dem2';

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'duocsi')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('duocsi', 'demo_hash_123', N'Phạm Dược Sĩ', 'duocsi@clinic.local', '0900000004');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'thungan')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('thungan', 'demo_hash_123', N'Võ Thu Ngân', 'thungan@clinic.local', '0900000005');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'quanly')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('quanly', 'demo_hash_123', N'Hoàng Quản Lý', 'quanly@clinic.local', '0900000006');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'benhnhan1')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('benhnhan1', 'demo_hash_123', N'Nguyễn Văn An', 'an@example.com', '0911111111');
    END

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'benhnhan2')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('benhnhan2', 'demo_hash_123', N'Trần Thị Bình', 'binh@example.com', '0922222222');
    END


    /* =========================
       2. Gán role cho Users
       ========================= */

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Admin'
    WHERE u.Username = 'admin'
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Receptionist'
    WHERE u.Username = 'letan'
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Doctor'
    WHERE u.Username IN ('bacsi', 'bacsi_nhi', 'bacsi_tmh', 'bacsi_dalieu', 'bacsi_dem2')
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Pharmacist'
    WHERE u.Username = 'duocsi'
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Cashier'
    WHERE u.Username = 'thungan'
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Manager'
    WHERE u.Username = 'quanly'
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Patient'
    WHERE u.Username IN ('benhnhan1', 'benhnhan2')
      AND NOT EXISTS (
          SELECT 1 FROM UserRoles ur
          WHERE ur.UserId = u.UserId AND ur.RoleId = r.RoleId
      );


    /* =========================
       3. Tạo Employees
       ========================= */

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP001')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP001', N'Nam', '1990-01-01', N'TP. Hồ Chí Minh'
        FROM Users
        WHERE Username = 'letan';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP002')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP002', N'Nam', '1985-05-15', N'TP. Hồ Chí Minh'
        FROM Users
        WHERE Username = 'bacsi';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP006')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP006', N'Ná»¯', '1988-09-12', N'TP. Há»“ ChÃ­ Minh'
        FROM Users
        WHERE Username = 'bacsi_nhi';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP007')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP007', N'Nam', '1983-02-18', N'TP. Há»“ ChÃ­ Minh'
        FROM Users
        WHERE Username = 'bacsi_tmh';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP008')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP008', N'Ná»¯', '1990-06-25', N'TP. Há»“ ChÃ­ Minh'
        FROM Users
        WHERE Username = 'bacsi_dalieu';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP009')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP009', N'Nam', '1989-10-20', N'TP. Ho Chi Minh'
        FROM Users
        WHERE Username = 'bacsi_dem2';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP003')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP003', N'Nữ', '1992-07-20', N'TP. Hồ Chí Minh'
        FROM Users
        WHERE Username = 'duocsi';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP004')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP004', N'Nữ', '1991-03-10', N'TP. Hồ Chí Minh'
        FROM Users
        WHERE Username = 'thungan';
    END

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP005')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP005', N'Nam', '1980-11-22', N'TP. Hồ Chí Minh'
        FROM Users
        WHERE Username = 'quanly';
    END


    /* =========================
       4. Tạo Doctor
       ========================= */

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-001')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-001',
            8,
            150000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi'
          AND s.SpecialtyName = N'Nội tổng quát';
    END


    /* =========================
       5. Tạo Patients
       ========================= */

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'PAT001')
    BEGIN
        INSERT INTO Patients
        (
            UserId,
            PatientCode,
            FullName,
            Gender,
            DateOfBirth,
            Phone,
            Email,
            Address,
            HealthInsuranceNumber,
            EmergencyContactName,
            EmergencyContactPhone
        )
        SELECT
            UserId,
            'PAT001',
            N'Nguyễn Văn An',
            N'Nam',
            '2001-04-10',
            '0911111111',
            'an@example.com',
            N'Quận 1, TP. Hồ Chí Minh',
            'BHYT001',
            N'Nguyễn Văn Ba',
            '0988888888'
        FROM Users
        WHERE Username = 'benhnhan1';
    END

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'PAT002')
    BEGIN
        INSERT INTO Patients
        (
            UserId,
            PatientCode,
            FullName,
            Gender,
            DateOfBirth,
            Phone,
            Email,
            Address,
            HealthInsuranceNumber,
            EmergencyContactName,
            EmergencyContactPhone
        )
        SELECT
            UserId,
            'PAT002',
            N'Trần Thị Bình',
            N'Nữ',
            '1998-09-25',
            '0922222222',
            'binh@example.com',
            N'Quận 3, TP. Hồ Chí Minh',
            'BHYT002',
            N'Trần Văn Nam',
            '0977777777'
        FROM Users
        WHERE Username = 'benhnhan2';
    END

    UPDATE Patients
    SET
        HealthInsuranceNumber = COALESCE(HealthInsuranceNumber, 'BHYT001'),
        EmergencyContactName = COALESCE(EmergencyContactName, N'Nguyễn Văn Ba'),
        EmergencyContactPhone = COALESCE(EmergencyContactPhone, '0988888888')
    WHERE PatientCode = 'PAT001';

    UPDATE Patients
    SET
        HealthInsuranceNumber = COALESCE(HealthInsuranceNumber, 'BHYT002'),
        EmergencyContactName = COALESCE(EmergencyContactName, N'Trần Văn Nam'),
        EmergencyContactPhone = COALESCE(EmergencyContactPhone, '0977777777')
    WHERE PatientCode = 'PAT002';


    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-002')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-002',
            6,
            140000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi_nhi'
          AND s.SpecialtyName LIKE N'%Nhi%';
    END

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-003')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-003',
            10,
            160000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi_tmh'
          AND s.SpecialtyName = N'Tai mÅ©i há»ng';
    END

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-004')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-004',
            5,
            150000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi_dalieu'
          AND s.SpecialtyName = N'Da liá»…u';
    END


    /* =========================
       6. Tạo MedicalRecords
       ========================= */

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-NIGHT-002')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT TOP 1
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-NIGHT-002',
            7,
            150000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi_dem2'
        ORDER BY
            CASE
                WHEN s.SpecialtyName LIKE N'%Nội%' THEN 0
                WHEN s.SpecialtyName LIKE N'%Ná»™i%' THEN 0
                WHEN s.SpecialtyName LIKE N'%tổng%' THEN 0
                ELSE 1
            END,
            s.SpecialtyId;
    END

    IF NOT EXISTS (SELECT 1 FROM MedicalRecords WHERE RecordCode = 'MR001')
    BEGIN
        INSERT INTO MedicalRecords (PatientId, RecordCode)
        SELECT PatientId, 'MR001'
        FROM Patients
        WHERE PatientCode = 'PAT001';
    END

    IF NOT EXISTS (SELECT 1 FROM MedicalRecords WHERE RecordCode = 'MR002')
    BEGIN
        INSERT INTO MedicalRecords (PatientId, RecordCode)
        SELECT PatientId, 'MR002'
        FROM Patients
        WHERE PatientCode = 'PAT002';
    END


    /* =========================
       7. Tạo lịch làm việc bác sĩ hôm nay
       ========================= */

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-003')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT TOP 1
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-003',
            10,
            160000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi_tmh'
          AND s.SpecialtyName LIKE N'%Tai%';
    END

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'LIC-DOCTOR-004')
    BEGIN
        INSERT INTO Doctors
        (
            EmployeeId,
            SpecialtyId,
            LicenseNumber,
            ExperienceYears,
            ConsultationFee
        )
        SELECT TOP 1
            e.EmployeeId,
            s.SpecialtyId,
            'LIC-DOCTOR-004',
            5,
            150000
        FROM Employees e
        JOIN Users u ON e.UserId = u.UserId
        CROSS JOIN Specialties s
        WHERE u.Username = 'bacsi_dalieu'
          AND s.SpecialtyName LIKE N'%Da%';
    END

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
    DECLARE @DoctorId INT;
    DECLARE @NightDoctorId INT;
    DECLARE @RoomId INT;
    DECLARE @ReceptionistUserId INT;
    DECLARE @DoctorUserId INT;
    DECLARE @PharmacistUserId INT;
    DECLARE @CashierUserId INT;

    SELECT @DoctorId = d.DoctorId
    FROM Doctors d
    JOIN Employees e ON d.EmployeeId = e.EmployeeId
    JOIN Users u ON e.UserId = u.UserId
    WHERE u.Username = 'bacsi';

    SELECT @NightDoctorId = d.DoctorId
    FROM Doctors d
    JOIN Employees e ON d.EmployeeId = e.EmployeeId
    JOIN Users u ON e.UserId = u.UserId
    WHERE u.Username = 'bacsi_dem2';

    SELECT @RoomId = RoomId
    FROM Rooms
    WHERE RoomName = N'Phòng khám 101';

    SELECT @ReceptionistUserId = UserId FROM Users WHERE Username = 'letan';
    SELECT @DoctorUserId = UserId FROM Users WHERE Username = 'bacsi';
    SELECT @PharmacistUserId = UserId FROM Users WHERE Username = 'duocsi';
    SELECT @CashierUserId = UserId FROM Users WHERE Username = 'thungan';

    IF NOT EXISTS (
        SELECT 1
        FROM DoctorSchedules
        WHERE DoctorId = @DoctorId
          AND WorkDate = @Today
          AND StartTime = '08:00'
    )
    BEGIN
        INSERT INTO DoctorSchedules
        (
            DoctorId,
            RoomId,
            WorkDate,
            StartTime,
            EndTime,
            MaxPatients
        )
        VALUES
        (
            @DoctorId,
            @RoomId,
            @Today,
            '08:00',
            '17:00',
            20
        );
    END

    INSERT INTO DoctorSchedules
    (
        DoctorId,
        RoomId,
        WorkDate,
        StartTime,
        EndTime,
        MaxPatients
    )
    SELECT
        d.DoctorId,
        @RoomId,
        @Today,
        '08:00',
        '17:00',
        20
    FROM Doctors d
    JOIN Employees e ON d.EmployeeId = e.EmployeeId
    JOIN Users u ON e.UserId = u.UserId
    WHERE u.Username IN ('bacsi_nhi', 'bacsi_tmh', 'bacsi_dalieu')
      AND NOT EXISTS (
          SELECT 1
          FROM DoctorSchedules ds
          WHERE ds.DoctorId = d.DoctorId
            AND ds.WorkDate = @Today
            AND ds.StartTime = '08:00'
      );

    IF @NightDoctorId IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM DoctorSchedules
            WHERE DoctorId = @NightDoctorId
              AND WorkDate = @Today
              AND StartTime = '22:00'
       )
    BEGIN
        INSERT INTO DoctorSchedules
        (
            DoctorId,
            RoomId,
            WorkDate,
            StartTime,
            EndTime,
            MaxPatients
        )
        VALUES
        (
            @NightDoctorId,
            @RoomId,
            @Today,
            '22:00',
            '23:59',
            12
        );
    END

    IF @NightDoctorId IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM DoctorSchedules
            WHERE DoctorId = @NightDoctorId
              AND WorkDate = @Tomorrow
              AND StartTime = '00:00'
       )
    BEGIN
        INSERT INTO DoctorSchedules
        (
            DoctorId,
            RoomId,
            WorkDate,
            StartTime,
            EndTime,
            MaxPatients
        )
        VALUES
        (
            @NightDoctorId,
            @RoomId,
            @Tomorrow,
            '00:00',
            '06:00',
            12
        );
    END


    /* =========================
       8. Tạo Appointments hôm nay
       ========================= */

    IF NOT EXISTS (
        SELECT 1
        FROM Appointments
        WHERE DoctorId = @DoctorId
          AND AppointmentDate = @Today
          AND AppointmentTime = '08:00'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId,
            DoctorId,
            RoomId,
            AppointmentDate,
            AppointmentTime,
            Reason,
            Status,
            CreatedBy
        )
        SELECT
            p.PatientId,
            @DoctorId,
            @RoomId,
            @Today,
            '08:00',
            N'Dau dau, sot nhe',
            'CheckedIn',
            @ReceptionistUserId
        FROM Patients p
        WHERE p.PatientCode = 'PAT001';
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Appointments
        WHERE DoctorId = @DoctorId
          AND AppointmentDate = @Today
          AND AppointmentTime = '09:00'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId,
            DoctorId,
            RoomId,
            AppointmentDate,
            AppointmentTime,
            Reason,
            Status,
            CreatedBy
        )
        SELECT
            p.PatientId,
            @DoctorId,
            @RoomId,
            @Today,
            '09:00',
            N'Kham suc khoe tong quat',
            'Scheduled',
            @ReceptionistUserId
        FROM Patients p
        WHERE p.PatientCode = 'PAT002';
    END


    /* =========================
       9. Tạo Examination cho bệnh nhân PAT001
       ========================= */

    DECLARE @AppointmentId1 INT;
    DECLARE @MedicalRecordId1 INT;
    DECLARE @ExaminationId1 INT;

    SELECT @AppointmentId1 = a.AppointmentId
    FROM Appointments a
    JOIN Patients p ON a.PatientId = p.PatientId
    WHERE p.PatientCode = 'PAT001'
      AND a.AppointmentDate = @Today
      AND a.AppointmentTime = '08:00';

    SELECT @MedicalRecordId1 = mr.MedicalRecordId
    FROM MedicalRecords mr
    JOIN Patients p ON mr.PatientId = p.PatientId
    WHERE p.PatientCode = 'PAT001';

    IF NOT EXISTS (
        SELECT 1
        FROM Examinations
        WHERE AppointmentId = @AppointmentId1
    )
    BEGIN
        INSERT INTO Examinations
        (
            AppointmentId,
            MedicalRecordId,
            DoctorId,
            Symptoms,
            Diagnosis,
            Conclusion,
            Status,
            StartedAt
        )
        VALUES
        (
            @AppointmentId1,
            @MedicalRecordId1,
            @DoctorId,
            N'Sốt nhẹ, đau đầu, mệt mỏi',
            N'Cảm cúm thông thường',
            N'Uống thuốc và nghỉ ngơi',
            'InProgress',
            SYSDATETIME()
        );
    END

    SELECT @ExaminationId1 = ExaminationId
    FROM Examinations
    WHERE AppointmentId = @AppointmentId1;


    /* =========================
       10. Tạo ServiceOrder demo
       ========================= */

    IF NOT EXISTS (
        SELECT 1
        FROM ServiceOrders
        WHERE ExaminationId = @ExaminationId1
    )
    BEGIN
        INSERT INTO ServiceOrders
        (
            ExaminationId,
            ServiceId,
            Quantity,
            Status,
            Result
        )
        SELECT
            @ExaminationId1,
            ServiceId,
            1,
            'Completed',
            N'Kết quả bình thường'
        FROM Services
        WHERE ServiceName = N'Xét nghiệm máu';
    END


    /* =========================
       11. Tạo Prescription chờ cấp thuốc
       ========================= */

    DECLARE @PrescriptionId1 INT;

    IF NOT EXISTS (
        SELECT 1
        FROM Prescriptions
        WHERE ExaminationId = @ExaminationId1
    )
    BEGIN
        INSERT INTO Prescriptions
        (
            ExaminationId,
            DoctorId,
            Status,
            Note
        )
        VALUES
        (
            @ExaminationId1,
            @DoctorId,
            'Pending',
            N'Uống thuốc sau ăn'
        );
    END

    SELECT @PrescriptionId1 = PrescriptionId
    FROM Prescriptions
    WHERE ExaminationId = @ExaminationId1;

    IF NOT EXISTS (
        SELECT 1
        FROM PrescriptionDetails
        WHERE PrescriptionId = @PrescriptionId1
    )
    BEGIN
        INSERT INTO PrescriptionDetails
        (
            PrescriptionId,
            MedicineId,
            Quantity,
            Dosage,
            UsageInstruction
        )
        SELECT
            @PrescriptionId1,
            MedicineId,
            10,
            N'1 viên/lần, ngày 2 lần',
            N'Uống sau ăn sáng và tối'
        FROM Medicines
        WHERE MedicineName = N'Paracetamol 500mg';

        INSERT INTO PrescriptionDetails
        (
            PrescriptionId,
            MedicineId,
            Quantity,
            Dosage,
            UsageInstruction
        )
        SELECT
            @PrescriptionId1,
            MedicineId,
            6,
            N'1 viên/lần, ngày 2 lần',
            N'Uống sau ăn'
        FROM Medicines
        WHERE MedicineName = N'Vitamin C 500mg';
    END


    /* =========================
       12. Tạo Invoice chưa thanh toán
       ========================= */

    DECLARE @PatientId1 INT;
    DECLARE @InvoiceId1 INT;

    SELECT @PatientId1 = PatientId
    FROM Patients
    WHERE PatientCode = 'PAT001';

    IF NOT EXISTS (
        SELECT 1
        FROM Invoices
        WHERE ExaminationId = @ExaminationId1
    )
    BEGIN
        INSERT INTO Invoices
        (
            PatientId,
            ExaminationId,
            TotalAmount,
            Status,
            CreatedBy
        )
        VALUES
        (
            @PatientId1,
            @ExaminationId1,
            0,
            'Unpaid',
            @CashierUserId
        );
    END

    SELECT @InvoiceId1 = InvoiceId
    FROM Invoices
    WHERE ExaminationId = @ExaminationId1;

    IF NOT EXISTS (
        SELECT 1
        FROM InvoiceDetails
        WHERE InvoiceId = @InvoiceId1
    )
    BEGIN
        -- Tiền khám
        INSERT INTO InvoiceDetails
        (
            InvoiceId,
            ItemType,
            ItemId,
            Description,
            Quantity,
            UnitPrice
        )
        VALUES
        (
            @InvoiceId1,
            'Consultation',
            @DoctorId,
            N'Phí khám bác sĩ Nội tổng quát',
            1,
            150000
        );

        -- Dịch vụ xét nghiệm
        INSERT INTO InvoiceDetails
        (
            InvoiceId,
            ItemType,
            ItemId,
            Description,
            Quantity,
            UnitPrice
        )
        SELECT
            @InvoiceId1,
            'Service',
            s.ServiceId,
            s.ServiceName,
            1,
            s.Price
        FROM Services s
        WHERE s.ServiceName = N'Xét nghiệm máu';

        -- Thuốc
        INSERT INTO InvoiceDetails
        (
            InvoiceId,
            ItemType,
            ItemId,
            Description,
            Quantity,
            UnitPrice
        )
        SELECT
            @InvoiceId1,
            'Medicine',
            m.MedicineId,
            m.MedicineName,
            pd.Quantity,
            m.Price
        FROM PrescriptionDetails pd
        JOIN Medicines m ON pd.MedicineId = m.MedicineId
        WHERE pd.PrescriptionId = @PrescriptionId1;
    END

    -- Cập nhật tổng tiền invoice
    UPDATE i
    SET TotalAmount = x.TotalAmount
    FROM Invoices i
    CROSS APPLY (
        SELECT SUM(Amount) AS TotalAmount
        FROM InvoiceDetails id
        WHERE id.InvoiceId = i.InvoiceId
    ) x
    WHERE i.InvoiceId = @InvoiceId1;


    /* =========================
       13. Tạo 1 invoice đã thanh toán để view doanh thu có dữ liệu
       ========================= */

    DECLARE @PatientId2 INT;
    DECLARE @InvoiceId2 INT;

    SELECT @PatientId2 = PatientId
    FROM Patients
    WHERE PatientCode = 'PAT002';

    IF NOT EXISTS (
        SELECT 1
        FROM Invoices
        WHERE PatientId = @PatientId2
          AND ExaminationId IS NULL
          AND Status = 'Paid'
    )
    BEGIN
        INSERT INTO Invoices
        (
            PatientId,
            ExaminationId,
            TotalAmount,
            Status,
            CreatedBy,
            PaidAt
        )
        VALUES
        (
            @PatientId2,
            NULL,
            150000,
            'Paid',
            @CashierUserId,
            SYSDATETIME()
        );

        SET @InvoiceId2 = SCOPE_IDENTITY();

        INSERT INTO InvoiceDetails
        (
            InvoiceId,
            ItemType,
            ItemId,
            Description,
            Quantity,
            UnitPrice
        )
        VALUES
        (
            @InvoiceId2,
            'Consultation',
            @DoctorId,
            N'Phí khám tổng quát demo',
            1,
            150000
        );

        INSERT INTO Payments
        (
            InvoiceId,
            Amount,
            PaymentMethod,
            PaidBy,
            Note
        )
        VALUES
        (
            @InvoiceId2,
            150000,
            'Cash',
            @CashierUserId,
            N'Thanh toán demo'
        );
    END


    /* =========================
       14. Audit demo
       ========================= */

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        NewData
    )
    VALUES
    (
        @ReceptionistUserId,
        'SEED_DEMO_DATA',
        'Database',
        NULL,
        N'Dữ liệu demo ban đầu đã được tạo'
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    SELECT 
        ERROR_NUMBER() AS ErrorNumber,
        ERROR_MESSAGE() AS ErrorMessage,
        ERROR_LINE() AS ErrorLine;

    THROW;
END CATCH;
GO
