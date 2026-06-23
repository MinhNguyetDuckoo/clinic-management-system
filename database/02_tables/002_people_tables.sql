USE ClinicManagementDB;
GO
SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE Specialties (
    SpecialtyId INT IDENTITY(1,1) PRIMARY KEY,
    SpecialtyName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE Employees (
    EmployeeId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    EmployeeCode NVARCHAR(30) NOT NULL UNIQUE,
    Gender NVARCHAR(10) NULL,
    DateOfBirth DATE NULL,
    Address NVARCHAR(255) NULL,
    HireDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Employees_Users
        FOREIGN KEY (UserId)
        REFERENCES Users(UserId)
);
GO

CREATE TABLE Doctors (
    DoctorId INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId INT NOT NULL UNIQUE,
    SpecialtyId INT NOT NULL,
    LicenseNumber NVARCHAR(50) NOT NULL UNIQUE,
    ExperienceYears INT NOT NULL DEFAULT 0,
    ConsultationFee DECIMAL(18,2) NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Doctors_Employees
        FOREIGN KEY (EmployeeId)
        REFERENCES Employees(EmployeeId),

    CONSTRAINT FK_Doctors_Specialties
        FOREIGN KEY (SpecialtyId)
        REFERENCES Specialties(SpecialtyId)
);
GO

CREATE TABLE Patients (
    PatientId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    PatientCode NVARCHAR(30) NOT NULL UNIQUE,
    FullName NVARCHAR(150) NOT NULL,
    Gender NVARCHAR(10) NULL,
    DateOfBirth DATE NULL,
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(150) NULL,
    Address NVARCHAR(255) NULL,
    HealthInsuranceNumber NVARCHAR(50) NULL,
    EmergencyContactName NVARCHAR(150) NULL,
    EmergencyContactPhone NVARCHAR(20) NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Patients_Users
        FOREIGN KEY (UserId)
        REFERENCES Users(UserId)
);
GO