USE ClinicManagementDB;
GO

CREATE TABLE MedicineCategories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);
GO

CREATE TABLE Medicines (
    MedicineId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT NULL,
    MedicineName NVARCHAR(150) NOT NULL,
    Unit NVARCHAR(30) NOT NULL,
    Price DECIMAL(18,2) NOT NULL DEFAULT 0,
    StockQuantity INT NOT NULL DEFAULT 0,
    MinStockQuantity INT NOT NULL DEFAULT 10,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Medicines_Categories
        FOREIGN KEY (CategoryId)
        REFERENCES MedicineCategories(CategoryId),

    CONSTRAINT CK_Medicines_Stock
        CHECK (StockQuantity >= 0),

    CONSTRAINT CK_Medicines_Price
        CHECK (Price >= 0)
);
GO

CREATE TABLE Prescriptions (
    PrescriptionId INT IDENTITY(1,1) PRIMARY KEY,
    ExaminationId INT NOT NULL,
    DoctorId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    Note NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    DispensedBy INT NULL,
    DispensedAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Prescriptions_Examinations
        FOREIGN KEY (ExaminationId)
        REFERENCES Examinations(ExaminationId),

    CONSTRAINT FK_Prescriptions_Doctors
        FOREIGN KEY (DoctorId)
        REFERENCES Doctors(DoctorId),

    CONSTRAINT FK_Prescriptions_DispensedBy
        FOREIGN KEY (DispensedBy)
        REFERENCES Users(UserId),

    CONSTRAINT CK_Prescriptions_Status
        CHECK (Status IN ('Pending', 'Dispensed', 'Cancelled'))
);
GO

CREATE TABLE PrescriptionDetails (
    PrescriptionDetailId INT IDENTITY(1,1) PRIMARY KEY,
    PrescriptionId INT NOT NULL,
    MedicineId INT NOT NULL,
    Quantity INT NOT NULL,
    Dosage NVARCHAR(255) NULL,
    UsageInstruction NVARCHAR(500) NULL,

    CONSTRAINT FK_PrescriptionDetails_Prescriptions
        FOREIGN KEY (PrescriptionId)
        REFERENCES Prescriptions(PrescriptionId),

    CONSTRAINT FK_PrescriptionDetails_Medicines
        FOREIGN KEY (MedicineId)
        REFERENCES Medicines(MedicineId),

    CONSTRAINT CK_PrescriptionDetails_Quantity
        CHECK (Quantity > 0)
);
GO

CREATE TABLE InventoryTransactions (
    InventoryTransactionId INT IDENTITY(1,1) PRIMARY KEY,
    MedicineId INT NOT NULL,
    TransactionType NVARCHAR(20) NOT NULL,
    Quantity INT NOT NULL,
    ReferenceType NVARCHAR(50) NULL,
    ReferenceId INT NULL,
    Note NVARCHAR(500) NULL,
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_InventoryTransactions_Medicines
        FOREIGN KEY (MedicineId)
        REFERENCES Medicines(MedicineId),

    CONSTRAINT FK_InventoryTransactions_Users
        FOREIGN KEY (CreatedBy)
        REFERENCES Users(UserId),

    CONSTRAINT CK_InventoryTransactions_Type
        CHECK (TransactionType IN ('IN', 'OUT', 'ADJUST')),

    CONSTRAINT CK_InventoryTransactions_Quantity
        CHECK (Quantity > 0)
);
GO