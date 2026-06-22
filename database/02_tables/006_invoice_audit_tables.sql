USE ClinicManagementDB;
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE Invoices (
    InvoiceId INT IDENTITY(1,1) PRIMARY KEY,
    PatientId INT NOT NULL,
    ExaminationId INT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    PaidAt DATETIME2 NULL,
    RowVersion ROWVERSION,

    CONSTRAINT FK_Invoices_Patients
        FOREIGN KEY (PatientId)
        REFERENCES Patients(PatientId),

    CONSTRAINT FK_Invoices_Examinations
        FOREIGN KEY (ExaminationId)
        REFERENCES Examinations(ExaminationId),

    CONSTRAINT FK_Invoices_CreatedBy
        FOREIGN KEY (CreatedBy)
        REFERENCES Users(UserId),

    CONSTRAINT CK_Invoices_Status
        CHECK (Status IN ('Unpaid', 'Paid', 'Cancelled', 'Refunded'))
);
GO

CREATE TABLE InvoiceDetails (
    InvoiceDetailId INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId INT NOT NULL,
    ItemType NVARCHAR(50) NOT NULL,
    ItemId INT NULL,
    Description NVARCHAR(255) NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(18,2) NOT NULL,
    Amount AS (Quantity * UnitPrice) PERSISTED,

    CONSTRAINT FK_InvoiceDetails_Invoices
        FOREIGN KEY (InvoiceId)
        REFERENCES Invoices(InvoiceId),

    CONSTRAINT CK_InvoiceDetails_ItemType
        CHECK (ItemType IN ('Consultation', 'Service', 'Medicine')),

    CONSTRAINT CK_InvoiceDetails_Quantity
        CHECK (Quantity > 0),

    CONSTRAINT CK_InvoiceDetails_UnitPrice
        CHECK (UnitPrice >= 0)
);
GO

CREATE TABLE Payments (
    PaymentId INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    PaidBy INT NULL,
    PaidAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    Note NVARCHAR(255) NULL,

    CONSTRAINT FK_Payments_Invoices
        FOREIGN KEY (InvoiceId)
        REFERENCES Invoices(InvoiceId),

    CONSTRAINT FK_Payments_Users
        FOREIGN KEY (PaidBy)
        REFERENCES Users(UserId),

    CONSTRAINT CK_Payments_Amount
        CHECK (Amount > 0),

    CONSTRAINT CK_Payments_Method
        CHECK (PaymentMethod IN ('Cash', 'Card', 'BankTransfer', 'EWallet'))
);
GO

CREATE TABLE AuditLogs (
    AuditLogId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    Action NVARCHAR(100) NOT NULL,
    TableName NVARCHAR(100) NOT NULL,
    RecordId INT NULL,
    OldData NVARCHAR(MAX) NULL,
    NewData NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_AuditLogs_Users
        FOREIGN KEY (UserId)
        REFERENCES Users(UserId)
);
GO