USE ClinicManagementDB;
GO

CREATE TABLE Roles (
    RoleId INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) NULL UNIQUE,
    Phone NVARCHAR(20) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION
);
GO

CREATE TABLE UserRoles (
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    AssignedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),

    CONSTRAINT FK_UserRoles_Users
        FOREIGN KEY (UserId)
        REFERENCES Users(UserId),

    CONSTRAINT FK_UserRoles_Roles
        FOREIGN KEY (RoleId)
        REFERENCES Roles(RoleId)
);
GO

CREATE TABLE LoginHistories (
    LoginHistoryId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    LoginAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    IpAddress NVARCHAR(50) NULL,
    UserAgent NVARCHAR(255) NULL,

    CONSTRAINT FK_LoginHistories_Users
        FOREIGN KEY (UserId)
        REFERENCES Users(UserId)
);
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Patients_UserId_NotNull'
      AND object_id = OBJECT_ID('Patients')
)
BEGIN
    DROP INDEX UX_Patients_UserId_NotNull ON Patients;
END
GO

CREATE UNIQUE INDEX UX_Patients_UserId_NotNull
ON Patients(UserId)
WHERE UserId IS NOT NULL;
GO