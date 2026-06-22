USE ClinicManagementDB;
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @DemoPasswordHash NVARCHAR(255) = '123456';

    DECLARE @DoctorRoleId INT;
    DECLARE @ReceptionistRoleId INT;
    DECLARE @PharmacistRoleId INT;
    DECLARE @CashierRoleId INT;

    SELECT @DoctorRoleId = RoleId FROM Roles WHERE RoleName = 'Doctor';
    SELECT @ReceptionistRoleId = RoleId FROM Roles WHERE RoleName = 'Receptionist';
    SELECT @PharmacistRoleId = RoleId FROM Roles WHERE RoleName = 'Pharmacist';
    SELECT @CashierRoleId = RoleId FROM Roles WHERE RoleName = 'Cashier';

    /* Lookup users for CreatedBy / DispensedBy / PaidBy */
    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'demo.beauty.receptionist')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('demo.beauty.receptionist', @DemoPasswordHash, N'HoÃ ng Thu NgÃ¢n', 'receptionist@cliniccare.demo', '0901000101');
    END;

    IF @ReceptionistRoleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM UserRoles ur
           INNER JOIN Users u ON ur.UserId = u.UserId
           WHERE u.Username = 'demo.beauty.receptionist'
             AND ur.RoleId = @ReceptionistRoleId
       )
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT UserId, @ReceptionistRoleId
        FROM Users
        WHERE Username = 'demo.beauty.receptionist';
    END;

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'demo.beauty.pharmacist')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('demo.beauty.pharmacist', @DemoPasswordHash, N'Äáº·ng KhÃ¡nh Linh', 'pharmacist@cliniccare.demo', '0901000102');
    END;

    IF @PharmacistRoleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM UserRoles ur
           INNER JOIN Users u ON ur.UserId = u.UserId
           WHERE u.Username = 'demo.beauty.pharmacist'
             AND ur.RoleId = @PharmacistRoleId
       )
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT UserId, @PharmacistRoleId
        FROM Users
        WHERE Username = 'demo.beauty.pharmacist';
    END;

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'demo.beauty.cashier')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('demo.beauty.cashier', @DemoPasswordHash, N'VÃµ Thu NgÃ¢n', 'cashier@cliniccare.demo', '0901000103');
    END;

    IF @CashierRoleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM UserRoles ur
           INNER JOIN Users u ON ur.UserId = u.UserId
           WHERE u.Username = 'demo.beauty.cashier'
             AND ur.RoleId = @CashierRoleId
       )
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT UserId, @CashierRoleId
        FROM Users
        WHERE Username = 'demo.beauty.cashier';
    END;

    DECLARE @ReceptionistUserId INT;
    DECLARE @PharmacistUserId INT;
    DECLARE @CashierUserId INT;

    SELECT @ReceptionistUserId = UserId FROM Users WHERE Username = 'demo.beauty.receptionist';
    SELECT @PharmacistUserId = UserId FROM Users WHERE Username = 'demo.beauty.pharmacist';
    SELECT @CashierUserId = UserId FROM Users WHERE Username = 'demo.beauty.cashier';

    /* Specialties */
    IF NOT EXISTS (SELECT 1 FROM Specialties WHERE SpecialtyName = N'Ná»™i tá»•ng quÃ¡t')
        INSERT INTO Specialties (SpecialtyName, Description) VALUES (N'Ná»™i tá»•ng quÃ¡t', N'KhÃ¡m vÃ  Ä‘iá»u trá»‹ cÃ¡c bá»‡nh ná»™i khoa thÆ°á»ng gáº·p.');

    IF NOT EXISTS (SELECT 1 FROM Specialties WHERE SpecialtyName = N'Nhi khoa')
        INSERT INTO Specialties (SpecialtyName, Description) VALUES (N'Nhi khoa', N'ChÄƒm sÃ³c sá»©c khá»e tráº» em.');

    IF NOT EXISTS (SELECT 1 FROM Specialties WHERE SpecialtyName = N'Tim máº¡ch')
        INSERT INTO Specialties (SpecialtyName, Description) VALUES (N'Tim máº¡ch', N'KhÃ¡m, tÆ° váº¥n vÃ  theo dÃµi bá»‡nh lÃ½ tim máº¡ch.');

    IF NOT EXISTS (SELECT 1 FROM Specialties WHERE SpecialtyName = N'Da liá»…u')
        INSERT INTO Specialties (SpecialtyName, Description) VALUES (N'Da liá»…u', N'KhÃ¡m vÃ  Ä‘iá»u trá»‹ bá»‡nh lÃ½ da, tÃ³c, mÃ³ng.');

    IF NOT EXISTS (SELECT 1 FROM Specialties WHERE SpecialtyName = N'Tai mÅ©i há»ng')
        INSERT INTO Specialties (SpecialtyName, Description) VALUES (N'Tai mÅ©i há»ng', N'KhÃ¡m tai, mÅ©i, há»ng vÃ  Ä‘Æ°á»ng hÃ´ háº¥p trÃªn.');

    /* Rooms */
    IF NOT EXISTS (SELECT 1 FROM Rooms WHERE RoomName = N'PhÃ²ng 101 - Ná»™i tá»•ng quÃ¡t')
        INSERT INTO Rooms (RoomName, RoomType) VALUES (N'PhÃ²ng 101 - Ná»™i tá»•ng quÃ¡t', N'KhÃ¡m bá»‡nh');

    IF NOT EXISTS (SELECT 1 FROM Rooms WHERE RoomName = N'PhÃ²ng 102 - Nhi khoa')
        INSERT INTO Rooms (RoomName, RoomType) VALUES (N'PhÃ²ng 102 - Nhi khoa', N'KhÃ¡m bá»‡nh');

    IF NOT EXISTS (SELECT 1 FROM Rooms WHERE RoomName = N'PhÃ²ng 103 - Tim máº¡ch')
        INSERT INTO Rooms (RoomName, RoomType) VALUES (N'PhÃ²ng 103 - Tim máº¡ch', N'KhÃ¡m bá»‡nh');

    /* Doctor users, employees and doctors */
    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'demo.beauty.dr.noi')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('demo.beauty.dr.noi', @DemoPasswordHash, N'BÃ¡c sÄ© Nguyá»…n Minh Khang', 'dr.khang@cliniccare.demo', '0902000101');
    END;

    IF @DoctorRoleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM UserRoles ur
           INNER JOIN Users u ON ur.UserId = u.UserId
           WHERE u.Username = 'demo.beauty.dr.noi'
             AND ur.RoleId = @DoctorRoleId
       )
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT UserId, @DoctorRoleId FROM Users WHERE Username = 'demo.beauty.dr.noi';
    END;

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'DEMO-BEAUTY-EMP-DR-NOI')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address, HireDate)
        SELECT UserId, 'DEMO-BEAUTY-EMP-DR-NOI', N'Nam', '1984-04-12', N'Quáº­n 3, TP. Há»“ ChÃ­ Minh', '2016-06-01'
        FROM Users
        WHERE Username = 'demo.beauty.dr.noi';
    END;

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'DEMO-BEAUTY-LIC-NOI')
    BEGIN
        INSERT INTO Doctors (EmployeeId, SpecialtyId, LicenseNumber, ExperienceYears, ConsultationFee)
        SELECT e.EmployeeId, s.SpecialtyId, 'DEMO-BEAUTY-LIC-NOI', 10, 180000
        FROM Employees e
        CROSS JOIN Specialties s
        WHERE e.EmployeeCode = 'DEMO-BEAUTY-EMP-DR-NOI'
          AND s.SpecialtyName = N'Ná»™i tá»•ng quÃ¡t';
    END;

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'demo.beauty.dr.nhi')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('demo.beauty.dr.nhi', @DemoPasswordHash, N'BÃ¡c sÄ© Tráº§n Háº£i Yáº¿n', 'dr.yen@cliniccare.demo', '0902000102');
    END;

    IF @DoctorRoleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM UserRoles ur
           INNER JOIN Users u ON ur.UserId = u.UserId
           WHERE u.Username = 'demo.beauty.dr.nhi'
             AND ur.RoleId = @DoctorRoleId
       )
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT UserId, @DoctorRoleId FROM Users WHERE Username = 'demo.beauty.dr.nhi';
    END;

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'DEMO-BEAUTY-EMP-DR-NHI')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address, HireDate)
        SELECT UserId, 'DEMO-BEAUTY-EMP-DR-NHI', N'Ná»¯', '1988-09-18', N'ThÃ nh phá»‘ Thá»§ Äá»©c, TP. Há»“ ChÃ­ Minh', '2018-03-15'
        FROM Users
        WHERE Username = 'demo.beauty.dr.nhi';
    END;

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'DEMO-BEAUTY-LIC-NHI')
    BEGIN
        INSERT INTO Doctors (EmployeeId, SpecialtyId, LicenseNumber, ExperienceYears, ConsultationFee)
        SELECT e.EmployeeId, s.SpecialtyId, 'DEMO-BEAUTY-LIC-NHI', 8, 200000
        FROM Employees e
        CROSS JOIN Specialties s
        WHERE e.EmployeeCode = 'DEMO-BEAUTY-EMP-DR-NHI'
          AND s.SpecialtyName = N'Nhi khoa';
    END;

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'demo.beauty.dr.tim')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('demo.beauty.dr.tim', @DemoPasswordHash, N'BÃ¡c sÄ© Pháº¡m Quá»‘c Huy', 'dr.huy@cliniccare.demo', '0902000103');
    END;

    IF @DoctorRoleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM UserRoles ur
           INNER JOIN Users u ON ur.UserId = u.UserId
           WHERE u.Username = 'demo.beauty.dr.tim'
             AND ur.RoleId = @DoctorRoleId
       )
    BEGIN
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT UserId, @DoctorRoleId FROM Users WHERE Username = 'demo.beauty.dr.tim';
    END;

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'DEMO-BEAUTY-EMP-DR-TIM')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address, HireDate)
        SELECT UserId, 'DEMO-BEAUTY-EMP-DR-TIM', N'Nam', '1981-12-05', N'Quáº­n BÃ¬nh Tháº¡nh, TP. Há»“ ChÃ­ Minh', '2014-08-20'
        FROM Users
        WHERE Username = 'demo.beauty.dr.tim';
    END;

    IF NOT EXISTS (SELECT 1 FROM Doctors WHERE LicenseNumber = 'DEMO-BEAUTY-LIC-TIM')
    BEGIN
        INSERT INTO Doctors (EmployeeId, SpecialtyId, LicenseNumber, ExperienceYears, ConsultationFee)
        SELECT e.EmployeeId, s.SpecialtyId, 'DEMO-BEAUTY-LIC-TIM', 13, 250000
        FROM Employees e
        CROSS JOIN Specialties s
        WHERE e.EmployeeCode = 'DEMO-BEAUTY-EMP-DR-TIM'
          AND s.SpecialtyName = N'Tim máº¡ch';
    END;

    DECLARE @DoctorNoiId INT;
    DECLARE @DoctorNhiId INT;
    DECLARE @DoctorTimId INT;
    DECLARE @RoomNoiId INT;
    DECLARE @RoomNhiId INT;
    DECLARE @RoomTimId INT;

    SELECT @DoctorNoiId = d.DoctorId
    FROM Doctors d
    WHERE d.LicenseNumber = 'DEMO-BEAUTY-LIC-NOI';

    SELECT @DoctorNhiId = d.DoctorId
    FROM Doctors d
    WHERE d.LicenseNumber = 'DEMO-BEAUTY-LIC-NHI';

    SELECT @DoctorTimId = d.DoctorId
    FROM Doctors d
    WHERE d.LicenseNumber = 'DEMO-BEAUTY-LIC-TIM';

    SELECT @RoomNoiId = RoomId FROM Rooms WHERE RoomName = N'PhÃ²ng 101 - Ná»™i tá»•ng quÃ¡t';
    SELECT @RoomNhiId = RoomId FROM Rooms WHERE RoomName = N'PhÃ²ng 102 - Nhi khoa';
    SELECT @RoomTimId = RoomId FROM Rooms WHERE RoomName = N'PhÃ²ng 103 - Tim máº¡ch';

    /* Patients and medical records */
    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-AN')
    BEGIN
        INSERT INTO Patients
        (
            PatientCode, FullName, Gender, DateOfBirth, Phone, Email, Address,
            HealthInsuranceNumber, EmergencyContactName, EmergencyContactPhone
        )
        VALUES
        (
            'DEMO-BEAUTY-PAT-AN', N'Nguyá»…n VÄƒn An', N'Nam', '1990-05-20',
            '0913000101', 'nguyenvanan@cliniccare.demo', N'24 Nguyá»…n Thá»‹ Minh Khai, Quáº­n 1, TP. Há»“ ChÃ­ Minh',
            'HC-DEMO-AN-001', N'Nguyá»…n Thá»‹ Mai', '0913000199'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-BINH')
    BEGIN
        INSERT INTO Patients
        (
            PatientCode, FullName, Gender, DateOfBirth, Phone, Email, Address,
            HealthInsuranceNumber, EmergencyContactName, EmergencyContactPhone
        )
        VALUES
        (
            'DEMO-BEAUTY-PAT-BINH', N'Tráº§n Thá»‹ BÃ¬nh', N'Ná»¯', '1987-11-03',
            '0913000102', 'tranthibinh@cliniccare.demo', N'15 LÃª VÄƒn Sá»¹, Quáº­n PhÃº Nhuáº­n, TP. Há»“ ChÃ­ Minh',
            'HC-DEMO-BINH-002', N'Tráº§n Minh Äá»©c', '0913000299'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-CHAU')
    BEGIN
        INSERT INTO Patients
        (
            PatientCode, FullName, Gender, DateOfBirth, Phone, Email, Address,
            HealthInsuranceNumber, EmergencyContactName, EmergencyContactPhone
        )
        VALUES
        (
            'DEMO-BEAUTY-PAT-CHAU', N'LÃª Minh ChÃ¢u', N'Ná»¯', '1978-07-14',
            '0913000103', 'leminhchau@cliniccare.demo', N'88 VÃµ VÄƒn Táº§n, Quáº­n 3, TP. Há»“ ChÃ­ Minh',
            'HC-DEMO-CHAU-003', N'LÃª HoÃ ng Nam', '0913000399'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-HUY')
    BEGIN
        INSERT INTO Patients
        (
            PatientCode, FullName, Gender, DateOfBirth, Phone, Email, Address,
            HealthInsuranceNumber, EmergencyContactName, EmergencyContactPhone
        )
        VALUES
        (
            'DEMO-BEAUTY-PAT-HUY', N'HoÃ ng Gia Huy', N'Nam', '2018-02-09',
            '0913000104', 'hoanggiahuy@cliniccare.demo', N'42 Phan XÃ­ch Long, Quáº­n PhÃº Nhuáº­n, TP. Há»“ ChÃ­ Minh',
            'HC-DEMO-HUY-004', N'HoÃ ng Thá»‹ Lan', '0913000499'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-LAN')
    BEGIN
        INSERT INTO Patients
        (
            PatientCode, FullName, Gender, DateOfBirth, Phone, Email, Address,
            HealthInsuranceNumber, EmergencyContactName, EmergencyContactPhone
        )
        VALUES
        (
            'DEMO-BEAUTY-PAT-LAN', N'Pháº¡m Ngá»c Lan', N'Ná»¯', '1995-09-26',
            '0913000105', 'phamngoclan@cliniccare.demo', N'19 Nguyá»…n Há»¯u Cáº£nh, Quáº­n BÃ¬nh Tháº¡nh, TP. Há»“ ChÃ­ Minh',
            'HC-DEMO-LAN-005', N'Pháº¡m Quá»‘c Báº£o', '0913000599'
        );
    END;

    INSERT INTO MedicalRecords (PatientId, RecordCode)
    SELECT p.PatientId, CONCAT('DEMO-BEAUTY-MR-', RIGHT(p.PatientCode, CHARINDEX('-', REVERSE(p.PatientCode)) - 1))
    FROM Patients p
    WHERE p.PatientCode IN (
        'DEMO-BEAUTY-PAT-AN',
        'DEMO-BEAUTY-PAT-BINH',
        'DEMO-BEAUTY-PAT-CHAU',
        'DEMO-BEAUTY-PAT-HUY',
        'DEMO-BEAUTY-PAT-LAN'
    )
      AND NOT EXISTS (
          SELECT 1
          FROM MedicalRecords mr
          WHERE mr.PatientId = p.PatientId
      );

    DECLARE @PatientAnId INT;
    DECLARE @PatientBinhId INT;
    DECLARE @PatientChauId INT;
    DECLARE @PatientHuyId INT;
    DECLARE @PatientLanId INT;
    DECLARE @MrBinhId INT;
    DECLARE @MrChauId INT;
    DECLARE @MrHuyId INT;

    SELECT @PatientAnId = PatientId FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-AN';
    SELECT @PatientBinhId = PatientId FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-BINH';
    SELECT @PatientChauId = PatientId FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-CHAU';
    SELECT @PatientHuyId = PatientId FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-HUY';
    SELECT @PatientLanId = PatientId FROM Patients WHERE PatientCode = 'DEMO-BEAUTY-PAT-LAN';
    SELECT @MrBinhId = MedicalRecordId FROM MedicalRecords WHERE PatientId = @PatientBinhId;
    SELECT @MrChauId = MedicalRecordId FROM MedicalRecords WHERE PatientId = @PatientChauId;
    SELECT @MrHuyId = MedicalRecordId FROM MedicalRecords WHERE PatientId = @PatientHuyId;

    /* Doctor schedules, all active and non-overlapping */
    IF NOT EXISTS (
        SELECT 1 FROM DoctorSchedules
        WHERE DoctorId = @DoctorNoiId
          AND WorkDate = '2026-05-03'
          AND StartTime = '08:00'
          AND EndTime = '12:00'
    )
    BEGIN
        INSERT INTO DoctorSchedules (DoctorId, RoomId, WorkDate, StartTime, EndTime, MaxPatients, IsActive)
        VALUES (@DoctorNoiId, @RoomNoiId, '2026-05-03', '08:00', '12:00', 16, 1);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM DoctorSchedules
        WHERE DoctorId = @DoctorNoiId
          AND WorkDate = '2026-05-03'
          AND StartTime = '13:30'
          AND EndTime = '17:00'
    )
    BEGIN
        INSERT INTO DoctorSchedules (DoctorId, RoomId, WorkDate, StartTime, EndTime, MaxPatients, IsActive)
        VALUES (@DoctorNoiId, @RoomNoiId, '2026-05-03', '13:30', '17:00', 14, 1);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM DoctorSchedules
        WHERE DoctorId = @DoctorNhiId
          AND WorkDate = '2026-05-03'
          AND StartTime = '08:00'
          AND EndTime = '12:00'
    )
    BEGIN
        INSERT INTO DoctorSchedules (DoctorId, RoomId, WorkDate, StartTime, EndTime, MaxPatients, IsActive)
        VALUES (@DoctorNhiId, @RoomNhiId, '2026-05-03', '08:00', '12:00', 14, 1);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM DoctorSchedules
        WHERE DoctorId = @DoctorTimId
          AND WorkDate = '2026-05-03'
          AND StartTime = '08:00'
          AND EndTime = '12:00'
    )
    BEGIN
        INSERT INTO DoctorSchedules (DoctorId, RoomId, WorkDate, StartTime, EndTime, MaxPatients, IsActive)
        VALUES (@DoctorTimId, @RoomTimId, '2026-05-03', '08:00', '12:00', 12, 1);
    END;

    /* Appointments: Scheduled, CheckedIn, Completed, Cancelled */
    IF NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE PatientId = @PatientAnId
          AND DoctorId = @DoctorNoiId
          AND AppointmentDate = '2026-05-03'
          AND AppointmentTime = '09:00'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId, DoctorId, RoomId, AppointmentDate, AppointmentTime,
            Reason, Status, CreatedBy
        )
        VALUES
        (
            @PatientAnId, @DoctorNoiId, @RoomNoiId, '2026-05-03', '09:00',
            N'TÃ¡i khÃ¡m Ä‘au dáº¡ dÃ y, cáº§n tÆ° váº¥n cháº¿ Ä‘á»™ Äƒn.', 'Scheduled', @ReceptionistUserId
        );
    END;

    IF NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE PatientId = @PatientBinhId
          AND DoctorId = @DoctorNoiId
          AND AppointmentDate = '2026-05-03'
          AND AppointmentTime = '09:30'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId, DoctorId, RoomId, AppointmentDate, AppointmentTime,
            Reason, Status, CreatedBy
        )
        VALUES
        (
            @PatientBinhId, @DoctorNoiId, @RoomNoiId, '2026-05-03', '09:30',
            N'Sá»‘t nháº¹, Ä‘au há»ng, má»‡t má»i hai ngÃ y.', 'CheckedIn', @ReceptionistUserId
        );
    END;

    IF NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE PatientId = @PatientChauId
          AND DoctorId = @DoctorTimId
          AND AppointmentDate = '2026-05-03'
          AND AppointmentTime = '08:30'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId, DoctorId, RoomId, AppointmentDate, AppointmentTime,
            Reason, Status, CreatedBy
        )
        VALUES
        (
            @PatientChauId, @DoctorTimId, @RoomTimId, '2026-05-03', '08:30',
            N'KhÃ¡m Ä‘au ngá»±c nháº¹ vÃ  theo dÃµi huyáº¿t Ã¡p.', 'Completed', @ReceptionistUserId
        );
    END;

    IF NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE PatientId = @PatientHuyId
          AND DoctorId = @DoctorNhiId
          AND AppointmentDate = '2026-05-03'
          AND AppointmentTime = '08:30'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId, DoctorId, RoomId, AppointmentDate, AppointmentTime,
            Reason, Status, CreatedBy
        )
        VALUES
        (
            @PatientHuyId, @DoctorNhiId, @RoomNhiId, '2026-05-03', '08:30',
            N'Ho, sá»• mÅ©i, cáº§n kiá»ƒm tra hÃ´ háº¥p.', 'CheckedIn', @ReceptionistUserId
        );
    END;

    IF NOT EXISTS (
        SELECT 1 FROM Appointments
        WHERE PatientId = @PatientLanId
          AND DoctorId = @DoctorNoiId
          AND AppointmentDate = '2026-05-03'
          AND AppointmentTime = '14:00'
    )
    BEGIN
        INSERT INTO Appointments
        (
            PatientId, DoctorId, RoomId, AppointmentDate, AppointmentTime,
            Reason, Status, CreatedBy, CancelledBy, CancelReason
        )
        VALUES
        (
            @PatientLanId, @DoctorNoiId, @RoomNoiId, '2026-05-03', '14:00',
            N'KhÃ¡m sá»©c khá»e tá»•ng quÃ¡t.', 'Cancelled', @ReceptionistUserId,
            @ReceptionistUserId, N'Bá»‡nh nhÃ¢n Ä‘á»•i lá»‹ch sang tuáº§n sau.'
        );
    END;

    DECLARE @ApptBinhId INT;
    DECLARE @ApptChauId INT;
    DECLARE @ApptHuyId INT;

    SELECT @ApptBinhId = AppointmentId
    FROM Appointments
    WHERE PatientId = @PatientBinhId
      AND DoctorId = @DoctorNoiId
      AND AppointmentDate = '2026-05-03'
      AND AppointmentTime = '09:30';

    SELECT @ApptChauId = AppointmentId
    FROM Appointments
    WHERE PatientId = @PatientChauId
      AND DoctorId = @DoctorTimId
      AND AppointmentDate = '2026-05-03'
      AND AppointmentTime = '08:30';

    SELECT @ApptHuyId = AppointmentId
    FROM Appointments
    WHERE PatientId = @PatientHuyId
      AND DoctorId = @DoctorNhiId
      AND AppointmentDate = '2026-05-03'
      AND AppointmentTime = '08:30';

    /* Examinations: Waiting, InProgress, Completed */
    IF NOT EXISTS (SELECT 1 FROM Examinations WHERE AppointmentId = @ApptHuyId)
    BEGIN
        INSERT INTO Examinations
        (
            AppointmentId, MedicalRecordId, DoctorId, Symptoms, Diagnosis,
            Conclusion, Status, CreatedAt
        )
        VALUES
        (
            @ApptHuyId, @MrHuyId, @DoctorNhiId, N'Ho khan, ngháº¹t mÅ©i, khÃ´ng sá»‘t cao.',
            NULL, NULL, 'Waiting', '2026-05-03T08:35:00'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Examinations WHERE AppointmentId = @ApptBinhId)
    BEGIN
        INSERT INTO Examinations
        (
            AppointmentId, MedicalRecordId, DoctorId, Symptoms, Diagnosis,
            Conclusion, Status, StartedAt, CreatedAt
        )
        VALUES
        (
            @ApptBinhId, @MrBinhId, @DoctorNoiId,
            N'Sá»‘t nháº¹ 38 Ä‘á»™, Ä‘au há»ng, má»‡t má»i.',
            N'ViÃªm há»ng cáº¥p, theo dÃµi nhiá»…m siÃªu vi.',
            N'Uá»‘ng thuá»‘c theo Ä‘Æ¡n, nghá»‰ ngÆ¡i vÃ  uá»‘ng nhiá»u nÆ°á»›c.',
            'InProgress', '2026-05-03T09:40:00', '2026-05-03T09:35:00'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM Examinations WHERE AppointmentId = @ApptChauId)
    BEGIN
        INSERT INTO Examinations
        (
            AppointmentId, MedicalRecordId, DoctorId, Symptoms, Diagnosis,
            Conclusion, Status, StartedAt, FinishedAt, CreatedAt
        )
        VALUES
        (
            @ApptChauId, @MrChauId, @DoctorTimId,
            N'Há»“i há»™p, Ä‘au tá»©c ngá»±c thoÃ¡ng qua khi leo cáº§u thang.',
            N'TÄƒng huyáº¿t Ã¡p Ä‘á»™ 1, cáº§n theo dÃµi thÃªm.',
            N'TÃ¡i khÃ¡m sau 2 tuáº§n, duy trÃ¬ thuá»‘c vÃ  cháº¿ Ä‘á»™ Äƒn giáº£m muá»‘i.',
            'Completed', '2026-05-03T08:40:00', '2026-05-03T09:15:00', '2026-05-03T08:35:00'
        );
    END;

    DECLARE @ExamBinhId INT;
    DECLARE @ExamChauId INT;

    SELECT @ExamBinhId = ExaminationId FROM Examinations WHERE AppointmentId = @ApptBinhId;
    SELECT @ExamChauId = ExaminationId FROM Examinations WHERE AppointmentId = @ApptChauId;

    /* Services and service orders */
    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceName = N'KhÃ¡m ná»™i tá»•ng quÃ¡t' AND ServiceType = N'Consultation')
        INSERT INTO Services (ServiceName, ServiceType, Price) VALUES (N'KhÃ¡m ná»™i tá»•ng quÃ¡t', N'Consultation', 180000);

    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceName = N'XÃ©t nghiá»‡m cÃ´ng thá»©c mÃ¡u' AND ServiceType = N'Laboratory')
        INSERT INTO Services (ServiceName, ServiceType, Price) VALUES (N'XÃ©t nghiá»‡m cÃ´ng thá»©c mÃ¡u', N'Laboratory', 120000);

    IF NOT EXISTS (SELECT 1 FROM Services WHERE ServiceName = N'SiÃªu Ã¢m tim' AND ServiceType = N'Imaging')
        INSERT INTO Services (ServiceName, ServiceType, Price) VALUES (N'SiÃªu Ã¢m tim', N'Imaging', 350000);

    DECLARE @ServiceBloodId INT;
    DECLARE @ServiceEchoId INT;
    SELECT @ServiceBloodId = ServiceId FROM Services WHERE ServiceName = N'XÃ©t nghiá»‡m cÃ´ng thá»©c mÃ¡u' AND ServiceType = N'Laboratory';
    SELECT @ServiceEchoId = ServiceId FROM Services WHERE ServiceName = N'SiÃªu Ã¢m tim' AND ServiceType = N'Imaging';

    IF NOT EXISTS (SELECT 1 FROM ServiceOrders WHERE ExaminationId = @ExamBinhId AND ServiceId = @ServiceBloodId)
    BEGIN
        INSERT INTO ServiceOrders (ExaminationId, ServiceId, Quantity, Status, Result, OrderedAt, CompletedAt)
        VALUES (@ExamBinhId, @ServiceBloodId, 1, 'Ordered', NULL, '2026-05-03T09:45:00', NULL);
    END;

    IF NOT EXISTS (SELECT 1 FROM ServiceOrders WHERE ExaminationId = @ExamChauId AND ServiceId = @ServiceEchoId)
    BEGIN
        INSERT INTO ServiceOrders (ExaminationId, ServiceId, Quantity, Status, Result, OrderedAt, CompletedAt)
        VALUES (@ExamChauId, @ServiceEchoId, 1, 'Completed', N'Chá»©c nÄƒng co bÃ³p tháº¥t trÃ¡i trong giá»›i háº¡n bÃ¬nh thÆ°á»ng.', '2026-05-03T08:50:00', '2026-05-03T09:05:00');
    END;

    /* Medicine categories and medicines */
    IF NOT EXISTS (SELECT 1 FROM MedicineCategories WHERE CategoryName = N'Giáº£m Ä‘au - háº¡ sá»‘t')
        INSERT INTO MedicineCategories (CategoryName, Description) VALUES (N'Giáº£m Ä‘au - háº¡ sá»‘t', N'Thuá»‘c há»— trá»£ giáº£m Ä‘au vÃ  háº¡ sá»‘t.');

    IF NOT EXISTS (SELECT 1 FROM MedicineCategories WHERE CategoryName = N'Vitamin vÃ  khoÃ¡ng cháº¥t')
        INSERT INTO MedicineCategories (CategoryName, Description) VALUES (N'Vitamin vÃ  khoÃ¡ng cháº¥t', N'Bá»• sung vitamin, khoÃ¡ng cháº¥t.');

    IF NOT EXISTS (SELECT 1 FROM MedicineCategories WHERE CategoryName = N'Tim máº¡ch - huyáº¿t Ã¡p')
        INSERT INTO MedicineCategories (CategoryName, Description) VALUES (N'Tim máº¡ch - huyáº¿t Ã¡p', N'Thuá»‘c há»— trá»£ Ä‘iá»u trá»‹ bá»‡nh tim máº¡ch vÃ  huyáº¿t Ã¡p.');

    IF NOT EXISTS (SELECT 1 FROM MedicineCategories WHERE CategoryName = N'Tai mÅ©i há»ng')
        INSERT INTO MedicineCategories (CategoryName, Description) VALUES (N'Tai mÅ©i há»ng', N'Thuá»‘c dÃ¹ng cho bá»‡nh lÃ½ tai mÅ©i há»ng.');

    DECLARE @CatPainId INT;
    DECLARE @CatVitaminId INT;
    DECLARE @CatHeartId INT;
    DECLARE @CatEntId INT;
    SELECT @CatPainId = CategoryId FROM MedicineCategories WHERE CategoryName = N'Giáº£m Ä‘au - háº¡ sá»‘t';
    SELECT @CatVitaminId = CategoryId FROM MedicineCategories WHERE CategoryName = N'Vitamin vÃ  khoÃ¡ng cháº¥t';
    SELECT @CatHeartId = CategoryId FROM MedicineCategories WHERE CategoryName = N'Tim máº¡ch - huyáº¿t Ã¡p';
    SELECT @CatEntId = CategoryId FROM MedicineCategories WHERE CategoryName = N'Tai mÅ©i há»ng';

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE MedicineName = N'Paracetamol 500mg' AND Unit = N'ViÃªn')
        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
        VALUES (@CatPainId, N'Paracetamol 500mg', N'ViÃªn', 1500, 120, 30);

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE MedicineName = N'Vitamin C 500mg' AND Unit = N'ViÃªn')
        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
        VALUES (@CatVitaminId, N'Vitamin C 500mg', N'ViÃªn', 1200, 80, 25);

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE MedicineName = N'Amlodipine 5mg' AND Unit = N'ViÃªn')
        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
        VALUES (@CatHeartId, N'Amlodipine 5mg', N'ViÃªn', 2500, 42, 20);

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE MedicineName = N'Natri Clorid 0.9% nhá» mÅ©i' AND Unit = N'Chai')
        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
        VALUES (@CatEntId, N'Natri Clorid 0.9% nhá» mÅ©i', N'Chai', 9000, 8, 10);

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE MedicineName = N'Loratadine 10mg' AND Unit = N'ViÃªn')
        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
        VALUES (@CatEntId, N'Loratadine 10mg', N'ViÃªn', 1800, 0, 15);

    IF NOT EXISTS (SELECT 1 FROM Medicines WHERE MedicineName = N'Oresol cam gÃ³i ClinicCare Demo' AND Unit = N'GÃ³i')
        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
        VALUES (@CatVitaminId, N'Oresol cam gÃ³i ClinicCare Demo', N'GÃ³i', 3500, 0, 20);

    DECLARE @MedParacetamolId INT;
    DECLARE @MedVitaminCId INT;
    DECLARE @MedAmlodipineId INT;
    SELECT @MedParacetamolId = MedicineId FROM Medicines WHERE MedicineName = N'Paracetamol 500mg' AND Unit = N'ViÃªn';
    SELECT @MedVitaminCId = MedicineId FROM Medicines WHERE MedicineName = N'Vitamin C 500mg' AND Unit = N'ViÃªn';
    SELECT @MedAmlodipineId = MedicineId FROM Medicines WHERE MedicineName = N'Amlodipine 5mg' AND Unit = N'ViÃªn';

    IF NOT EXISTS (
        SELECT 1 FROM InventoryTransactions
        WHERE MedicineId = @MedParacetamolId
          AND TransactionType = 'IN'
          AND ReferenceType = 'DEMO_BEAUTY_SEED'
          AND ReferenceId = @MedParacetamolId
    )
    BEGIN
        INSERT INTO InventoryTransactions (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy, CreatedAt)
        VALUES (@MedParacetamolId, 'IN', 120, 'DEMO_BEAUTY_SEED', @MedParacetamolId, N'Nháº­p kho demo Paracetamol 500mg.', @PharmacistUserId, '2026-05-01T08:00:00');
    END;

    IF NOT EXISTS (
        SELECT 1 FROM InventoryTransactions
        WHERE MedicineId = @MedVitaminCId
          AND TransactionType = 'IN'
          AND ReferenceType = 'DEMO_BEAUTY_SEED'
          AND ReferenceId = @MedVitaminCId
    )
    BEGIN
        INSERT INTO InventoryTransactions (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy, CreatedAt)
        VALUES (@MedVitaminCId, 'IN', 80, 'DEMO_BEAUTY_SEED', @MedVitaminCId, N'Nháº­p kho demo Vitamin C 500mg.', @PharmacistUserId, '2026-05-01T08:10:00');
    END;

    IF NOT EXISTS (
        SELECT 1 FROM InventoryTransactions
        WHERE MedicineId = @MedAmlodipineId
          AND TransactionType = 'IN'
          AND ReferenceType = 'DEMO_BEAUTY_SEED'
          AND ReferenceId = @MedAmlodipineId
    )
    BEGIN
        INSERT INTO InventoryTransactions (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy, CreatedAt)
        VALUES (@MedAmlodipineId, 'IN', 42, 'DEMO_BEAUTY_SEED', @MedAmlodipineId, N'Nháº­p kho demo Amlodipine 5mg.', @PharmacistUserId, '2026-05-01T08:20:00');
    END;

    /* Prescriptions and details */
    IF NOT EXISTS (SELECT 1 FROM Prescriptions WHERE ExaminationId = @ExamBinhId AND Status <> 'Cancelled')
    BEGIN
        INSERT INTO Prescriptions (ExaminationId, DoctorId, Status, Note, CreatedAt)
        VALUES (@ExamBinhId, @DoctorNoiId, 'Pending', N'ÄÆ¡n thuá»‘c demo luá»“ng B - chá» dÆ°á»£c sÄ© cáº¥p phÃ¡t.', '2026-05-03T10:00:00');
    END;

    IF NOT EXISTS (SELECT 1 FROM Prescriptions WHERE ExaminationId = @ExamChauId AND Status <> 'Cancelled')
    BEGIN
        INSERT INTO Prescriptions (ExaminationId, DoctorId, Status, Note, CreatedAt, DispensedBy, DispensedAt)
        VALUES (@ExamChauId, @DoctorTimId, 'Dispensed', N'ÄÆ¡n thuá»‘c demo luá»“ng C - Ä‘Ã£ cáº¥p thuá»‘c vÃ  thanh toÃ¡n.', '2026-05-03T09:20:00', @PharmacistUserId, '2026-05-03T09:35:00');
    END;

    DECLARE @PrescriptionBinhId INT;
    DECLARE @PrescriptionChauId INT;
    SELECT @PrescriptionBinhId = PrescriptionId FROM Prescriptions WHERE ExaminationId = @ExamBinhId AND Status <> 'Cancelled';
    SELECT @PrescriptionChauId = PrescriptionId FROM Prescriptions WHERE ExaminationId = @ExamChauId AND Status <> 'Cancelled';

    IF NOT EXISTS (SELECT 1 FROM PrescriptionDetails WHERE PrescriptionId = @PrescriptionBinhId AND MedicineId = @MedParacetamolId)
        INSERT INTO PrescriptionDetails (PrescriptionId, MedicineId, Quantity, Dosage, UsageInstruction)
        VALUES (@PrescriptionBinhId, @MedParacetamolId, 10, N'1 viÃªn/láº§n, ngÃ y 3 láº§n khi sá»‘t', N'Uá»‘ng sau Äƒn, khÃ´ng dÃ¹ng quÃ¡ 4g/ngÃ y.');

    IF NOT EXISTS (SELECT 1 FROM PrescriptionDetails WHERE PrescriptionId = @PrescriptionBinhId AND MedicineId = @MedVitaminCId)
        INSERT INTO PrescriptionDetails (PrescriptionId, MedicineId, Quantity, Dosage, UsageInstruction)
        VALUES (@PrescriptionBinhId, @MedVitaminCId, 10, N'1 viÃªn/láº§n, ngÃ y 1 láº§n', N'Uá»‘ng buá»•i sÃ¡ng sau Äƒn.');

    IF NOT EXISTS (SELECT 1 FROM PrescriptionDetails WHERE PrescriptionId = @PrescriptionChauId AND MedicineId = @MedAmlodipineId)
        INSERT INTO PrescriptionDetails (PrescriptionId, MedicineId, Quantity, Dosage, UsageInstruction)
        VALUES (@PrescriptionChauId, @MedAmlodipineId, 14, N'1 viÃªn/láº§n, ngÃ y 1 láº§n', N'Uá»‘ng vÃ o buá»•i sÃ¡ng, theo dÃµi huyáº¿t Ã¡p.');

    IF NOT EXISTS (SELECT 1 FROM PrescriptionDetails WHERE PrescriptionId = @PrescriptionChauId AND MedicineId = @MedVitaminCId)
        INSERT INTO PrescriptionDetails (PrescriptionId, MedicineId, Quantity, Dosage, UsageInstruction)
        VALUES (@PrescriptionChauId, @MedVitaminCId, 7, N'1 viÃªn/láº§n, ngÃ y 1 láº§n', N'Uá»‘ng sau Äƒn Ä‘á»ƒ há»— trá»£ sá»©c khá»e tá»•ng quÃ¡t.');

    IF NOT EXISTS (
        SELECT 1 FROM InventoryTransactions
        WHERE TransactionType = 'OUT'
          AND ReferenceType = 'Prescription'
          AND ReferenceId = @PrescriptionChauId
          AND MedicineId = @MedAmlodipineId
    )
    BEGIN
        INSERT INTO InventoryTransactions (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy, CreatedAt)
        VALUES (@MedAmlodipineId, 'OUT', 14, 'Prescription', @PrescriptionChauId, N'Cáº¥p thuá»‘c demo cho bá»‡nh nhÃ¢n LÃª Minh ChÃ¢u.', @PharmacistUserId, '2026-05-03T09:35:00');
    END;

    IF NOT EXISTS (
        SELECT 1 FROM InventoryTransactions
        WHERE TransactionType = 'OUT'
          AND ReferenceType = 'Prescription'
          AND ReferenceId = @PrescriptionChauId
          AND MedicineId = @MedVitaminCId
    )
    BEGIN
        INSERT INTO InventoryTransactions (MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId, Note, CreatedBy, CreatedAt)
        VALUES (@MedVitaminCId, 'OUT', 7, 'Prescription', @PrescriptionChauId, N'Cáº¥p thuá»‘c demo cho bá»‡nh nhÃ¢n LÃª Minh ChÃ¢u.', @PharmacistUserId, '2026-05-03T09:35:00');
    END;

    /* Paid invoice for flow C */
    IF NOT EXISTS (SELECT 1 FROM Invoices WHERE ExaminationId = @ExamChauId AND Status <> 'Cancelled')
    BEGIN
        INSERT INTO Invoices (PatientId, ExaminationId, TotalAmount, Status, CreatedBy, CreatedAt, PaidAt)
        VALUES (@PatientChauId, @ExamChauId, 643400, 'Paid', @CashierUserId, '2026-05-03T09:45:00', '2026-05-03T09:50:00');
    END;

    DECLARE @InvoiceChauId INT;
    SELECT @InvoiceChauId = InvoiceId FROM Invoices WHERE ExaminationId = @ExamChauId AND Status <> 'Cancelled';

    IF NOT EXISTS (SELECT 1 FROM InvoiceDetails WHERE InvoiceId = @InvoiceChauId AND ItemType = 'Consultation' AND ItemId = @DoctorTimId)
        INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
        VALUES (@InvoiceChauId, 'Consultation', @DoctorTimId, N'PhÃ­ khÃ¡m chuyÃªn khoa Tim máº¡ch', 1, 250000);

    IF NOT EXISTS (SELECT 1 FROM InvoiceDetails WHERE InvoiceId = @InvoiceChauId AND ItemType = 'Service' AND ItemId = @ServiceEchoId)
        INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
        VALUES (@InvoiceChauId, 'Service', @ServiceEchoId, N'SiÃªu Ã¢m tim', 1, 350000);

    IF NOT EXISTS (SELECT 1 FROM InvoiceDetails WHERE InvoiceId = @InvoiceChauId AND ItemType = 'Medicine' AND ItemId = @MedAmlodipineId)
        INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
        VALUES (@InvoiceChauId, 'Medicine', @MedAmlodipineId, N'Amlodipine 5mg', 14, 2500);

    IF NOT EXISTS (SELECT 1 FROM InvoiceDetails WHERE InvoiceId = @InvoiceChauId AND ItemType = 'Medicine' AND ItemId = @MedVitaminCId)
        INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
        VALUES (@InvoiceChauId, 'Medicine', @MedVitaminCId, N'Vitamin C 500mg', 7, 1200);

    DECLARE @InvoiceChauTotal DECIMAL(18,2);
    SELECT @InvoiceChauTotal = SUM(Amount)
    FROM InvoiceDetails
    WHERE InvoiceId = @InvoiceChauId;

    IF NOT EXISTS (SELECT 1 FROM Payments WHERE InvoiceId = @InvoiceChauId)
    BEGIN
        INSERT INTO Payments (InvoiceId, Amount, PaymentMethod, PaidBy, PaidAt, Note)
        VALUES (@InvoiceChauId, @InvoiceChauTotal, 'BankTransfer', @CashierUserId, '2026-05-03T09:50:00', N'Thanh toÃ¡n demo qua chuyá»ƒn khoáº£n.');
    END;

    /* Unpaid invoice for an additional clean cashier demo */
    IF NOT EXISTS (SELECT 1 FROM Invoices WHERE ExaminationId = @ExamBinhId AND Status <> 'Cancelled')
    BEGIN
        INSERT INTO Invoices (PatientId, ExaminationId, TotalAmount, Status, CreatedBy, CreatedAt)
        VALUES (@PatientBinhId, @ExamBinhId, 180000, 'Unpaid', @CashierUserId, '2026-05-03T10:15:00');
    END;

    DECLARE @InvoiceBinhId INT;
    SELECT @InvoiceBinhId = InvoiceId FROM Invoices WHERE ExaminationId = @ExamBinhId AND Status <> 'Cancelled';

    IF NOT EXISTS (SELECT 1 FROM InvoiceDetails WHERE InvoiceId = @InvoiceBinhId AND ItemType = 'Consultation' AND ItemId = @DoctorNoiId)
        INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
        VALUES (@InvoiceBinhId, 'Consultation', @DoctorNoiId, N'PhÃ­ khÃ¡m ná»™i tá»•ng quÃ¡t', 1, 180000);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
