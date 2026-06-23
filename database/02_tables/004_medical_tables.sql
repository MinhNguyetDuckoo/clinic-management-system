USE ClinicManagementDB;
GO

CREATE TABLE MedicalRecords (
    MedicalRecordId INT IDENTITY(1,1) PRIMARY KEY,
    PatientId INT NOT NULL,
    RecordCode NVARCHAR(30) NOT NULL UNIQUE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_MedicalRecords_PatientId
        UNIQUE (PatientId),

    CONSTRAINT FK_MedicalRecords_Patients
        FOREIGN KEY (PatientId)
        REFERENCES Patients(PatientId)
);
GO

CREATE TABLE Examinations (
    ExaminationId INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentId INT NOT NULL UNIQUE,
    MedicalRecordId INT NOT NULL,
    DoctorId INT NOT NULL,
    Symptoms NVARCHAR(1000) NULL,
    Diagnosis NVARCHAR(1000) NULL,
    Conclusion NVARCHAR(1000) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Waiting',
    StartedAt DATETIME2 NULL,
    FinishedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Examinations_Appointments
        FOREIGN KEY (AppointmentId)
        REFERENCES Appointments(AppointmentId),

    CONSTRAINT FK_Examinations_MedicalRecords
        FOREIGN KEY (MedicalRecordId)
        REFERENCES MedicalRecords(MedicalRecordId),

    CONSTRAINT FK_Examinations_Doctors
        FOREIGN KEY (DoctorId)
        REFERENCES Doctors(DoctorId),

    CONSTRAINT CK_Examinations_Status
        CHECK (Status IN ('Waiting', 'InProgress', 'Completed', 'Cancelled'))
);
GO

CREATE TABLE Services (
    ServiceId INT IDENTITY(1,1) PRIMARY KEY,
    ServiceName NVARCHAR(150) NOT NULL,
    ServiceType NVARCHAR(50) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE ServiceOrders (
    ServiceOrderId INT IDENTITY(1,1) PRIMARY KEY,
    ExaminationId INT NOT NULL,
    ServiceId INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Ordered',
    Result NVARCHAR(1000) NULL,
    OrderedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CompletedAt DATETIME2 NULL,

    CONSTRAINT FK_ServiceOrders_Examinations
        FOREIGN KEY (ExaminationId)
        REFERENCES Examinations(ExaminationId),

    CONSTRAINT FK_ServiceOrders_Services
        FOREIGN KEY (ServiceId)
        REFERENCES Services(ServiceId),

    CONSTRAINT CK_ServiceOrders_Status
        CHECK (Status IN ('Ordered', 'Processing', 'Completed', 'Cancelled'))
);
GO
