USE ClinicManagementDB;
GO

CREATE TABLE Rooms (
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    RoomName NVARCHAR(100) NOT NULL UNIQUE,
    RoomType NVARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE DoctorSchedules (
    ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
    DoctorId INT NOT NULL,
    RoomId INT NULL,
    WorkDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    MaxPatients INT NOT NULL DEFAULT 20,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_DoctorSchedules_Doctors
        FOREIGN KEY (DoctorId)
        REFERENCES Doctors(DoctorId),

    CONSTRAINT FK_DoctorSchedules_Rooms
        FOREIGN KEY (RoomId)
        REFERENCES Rooms(RoomId),

    CONSTRAINT CK_DoctorSchedules_Time
        CHECK (StartTime < EndTime)
);
GO

CREATE TABLE AppointmentStatuses (
    StatusId INT IDENTITY(1,1) PRIMARY KEY,
    StatusName NVARCHAR(50) NOT NULL UNIQUE
);
GO

CREATE TABLE Appointments (
    AppointmentId INT IDENTITY(1,1) PRIMARY KEY,
    PatientId INT NOT NULL,
    DoctorId INT NOT NULL,
    RoomId INT NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    Reason NVARCHAR(500) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    CreatedBy INT NULL,
    CancelledBy INT NULL,
    CancelReason NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Appointments_Patients
        FOREIGN KEY (PatientId)
        REFERENCES Patients(PatientId),

    CONSTRAINT FK_Appointments_Doctors
        FOREIGN KEY (DoctorId)
        REFERENCES Doctors(DoctorId),

    CONSTRAINT FK_Appointments_Rooms
        FOREIGN KEY (RoomId)
        REFERENCES Rooms(RoomId),

    CONSTRAINT FK_Appointments_CreatedBy
        FOREIGN KEY (CreatedBy)
        REFERENCES Users(UserId),

    CONSTRAINT FK_Appointments_CancelledBy
        FOREIGN KEY (CancelledBy)
        REFERENCES Users(UserId),

    CONSTRAINT CK_Appointments_Status
        CHECK (Status IN ('Scheduled', 'CheckedIn', 'InProgress', 'Completed', 'Cancelled', 'NoShow'))
);
GO