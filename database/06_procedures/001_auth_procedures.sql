USE ClinicManagementDB;
GO

/* =========================================================
   001_auth_procedures.sql
   Stored Procedure cho User / Role
   ========================================================= */


/* =========================================================
   1. Tạo user mới
   Lưu ý:
   PasswordHash sẽ được backend hash bằng bcrypt sau.
   SQL chỉ lưu hash.
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreateUser
    @Username NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @FullName NVARCHAR(150),
    @Email NVARCHAR(150) = NULL,
    @Phone NVARCHAR(20) = NULL,
    @NewUserId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1
            FROM Users WITH (UPDLOCK, HOLDLOCK)
            WHERE Username = @Username
        )
        BEGIN
            THROW 50001, N'Tên đăng nhập đã tồn tại.', 1;
        END;

        IF @Email IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Users WITH (UPDLOCK, HOLDLOCK)
                WHERE Email = @Email
           )
        BEGIN
            THROW 50002, N'Email đã tồn tại.', 1;
        END;

        INSERT INTO Users
        (
            Username,
            PasswordHash,
            FullName,
            Email,
            Phone
        )
        VALUES
        (
            @Username,
            @PasswordHash,
            @FullName,
            @Email,
            @Phone
        );

        SET @NewUserId = SCOPE_IDENTITY();

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
            @NewUserId,
            'CREATE_USER',
            'Users',
            @NewUserId,
            CONCAT(N'Created user: ', @Username)
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   2. Gán role cho user
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_AssignRole
    @UserId INT,
    @RoleName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @RoleId INT;

        SELECT @RoleId = RoleId
        FROM Roles
        WHERE RoleName = @RoleName;

        IF @RoleId IS NULL
        BEGIN
            THROW 50003, N'Role không tồn tại.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Users
            WHERE UserId = @UserId
              AND IsDeleted = 0
        )
        BEGIN
            THROW 50004, N'User không tồn tại.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM UserRoles WITH (UPDLOCK, HOLDLOCK)
            WHERE UserId = @UserId
              AND RoleId = @RoleId
        )
        BEGIN
            INSERT INTO UserRoles (UserId, RoleId)
            VALUES (@UserId, @RoleId);
        END;

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
            @UserId,
            'ASSIGN_ROLE',
            'UserRoles',
            @UserId,
            CONCAT(N'Assigned role: ', @RoleName)
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   3. Lấy user theo username
   Dùng cho backend login
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetUserByUsername
    @Username NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserId,
        u.Username,
        u.PasswordHash,
        u.FullName,
        u.Email,
        u.Phone,
        u.IsActive,
        u.IsDeleted,
        STRING_AGG(r.RoleName, ',') AS Roles
    FROM Users u
    LEFT JOIN UserRoles ur
        ON u.UserId = ur.UserId
    LEFT JOIN Roles r
        ON ur.RoleId = r.RoleId
    WHERE u.Username = @Username
    GROUP BY
        u.UserId,
        u.Username,
        u.PasswordHash,
        u.FullName,
        u.Email,
        u.Phone,
        u.IsActive,
        u.IsDeleted;
END;
GO