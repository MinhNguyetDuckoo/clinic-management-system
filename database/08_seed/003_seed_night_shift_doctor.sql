USE ClinicManagementDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'bacsi_dem2')
    BEGIN
        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone)
        VALUES ('bacsi_dem2', '123456', N'Bac Si Test Ca Dem 2', 'bacsi.dem2@clinic.local', '0900000010');
    END;

    UPDATE Users
    SET
        PasswordHash = '123456',
        FullName = N'Bac Si Test Ca Dem 2',
        IsActive = 1,
        IsDeleted = 0
    WHERE Username = 'bacsi_dem2';

    INSERT INTO UserRoles (UserId, RoleId)
    SELECT u.UserId, r.RoleId
    FROM Users u
    JOIN Roles r ON r.RoleName = 'Doctor'
    WHERE u.Username = 'bacsi_dem2'
      AND NOT EXISTS (
          SELECT 1
          FROM UserRoles ur
          WHERE ur.UserId = u.UserId
            AND ur.RoleId = r.RoleId
      );

    IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP009')
    BEGIN
        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address)
        SELECT UserId, 'EMP009', N'Nam', '1989-10-20', N'TP. Ho Chi Minh'
        FROM Users
        WHERE Username = 'bacsi_dem2';
    END;

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
    END;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
    DECLARE @NightDoctorId INT;
    DECLARE @RoomId INT;

    SELECT @NightDoctorId = d.DoctorId
    FROM Doctors d
    JOIN Employees e ON d.EmployeeId = e.EmployeeId
    JOIN Users u ON e.UserId = u.UserId
    WHERE u.Username = 'bacsi_dem2';

    SELECT TOP 1 @RoomId = RoomId
    FROM Rooms
    WHERE RoomType = 'Examination'
    ORDER BY RoomId;

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
    END;

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
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
