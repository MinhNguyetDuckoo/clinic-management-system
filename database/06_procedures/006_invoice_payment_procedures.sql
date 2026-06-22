USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   006_invoice_payment_procedures.sql
   Stored Procedure cho hóa đơn và thanh toán
   ========================================================= */


/* =========================================================
   1. Tạo hóa đơn cho một lần khám
   - Nếu đã có invoice active cho ExaminationId thì không tạo trùng
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreateInvoice
    @PatientId INT,
    @ExaminationId INT = NULL,
    @CreatedBy INT = NULL,
    @NewInvoiceId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM Patients
            WHERE PatientId = @PatientId
              AND IsDeleted = 0
        )
        BEGIN
            THROW 50501, N'Bệnh nhân không tồn tại.', 1;
        END;

        IF @ExaminationId IS NOT NULL
           AND NOT EXISTS (
                SELECT 1
                FROM Examinations
                WHERE ExaminationId = @ExaminationId
           )
        BEGIN
            THROW 50502, N'Phiếu khám không tồn tại.', 1;
        END;

        IF @ExaminationId IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Invoices WITH (UPDLOCK, HOLDLOCK)
                WHERE ExaminationId = @ExaminationId
                  AND Status <> 'Cancelled'
           )
        BEGIN
            THROW 50503, N'Phiếu khám này đã có hóa đơn.', 1;
        END;

        IF @ExaminationId IS NOT NULL
           AND EXISTS (
                SELECT 1
                FROM Prescriptions WITH (UPDLOCK, HOLDLOCK)
                WHERE ExaminationId = @ExaminationId
                  AND Status = 'Pending'
           )
        BEGIN
            THROW 50516, N'Don thuoc chua duoc cap phat, chua the tao hoa don.', 1;
        END;

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
            @PatientId,
            @ExaminationId,
            0,
            'Unpaid',
            @CreatedBy
        );

        SET @NewInvoiceId = SCOPE_IDENTITY();

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
            @CreatedBy,
            'CREATE_INVOICE',
            'Invoices',
            @NewInvoiceId,
            CONCAT(N'Created invoice id: ', @NewInvoiceId)
        );

        COMMIT TRANSACTION;

        SELECT @NewInvoiceId AS InvoiceId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   2. Thêm chi tiết hóa đơn
   ItemType: Consultation, Service, Medicine
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_AddInvoiceDetail
    @InvoiceId INT,
    @ItemType NVARCHAR(50),
    @ItemId INT = NULL,
    @Description NVARCHAR(255),
    @Quantity INT,
    @UnitPrice DECIMAL(18,2),
    @CreatedBy INT = NULL,
    @NewInvoiceDetailId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Quantity <= 0
        BEGIN
            THROW 50504, N'Số lượng phải lớn hơn 0.', 1;
        END;

        IF @UnitPrice < 0
        BEGIN
            THROW 50505, N'Đơn giá không được âm.', 1;
        END;

        IF @ItemType NOT IN ('Consultation', 'Service', 'Medicine')
        BEGIN
            THROW 50506, N'Loại dòng hóa đơn không hợp lệ.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM Invoices WITH (UPDLOCK, HOLDLOCK)
            WHERE InvoiceId = @InvoiceId
              AND Status = 'Unpaid'
        )
        BEGIN
            THROW 50507, N'Hóa đơn không tồn tại hoặc không còn ở trạng thái Unpaid.', 1;
        END;

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
            @InvoiceId,
            @ItemType,
            @ItemId,
            @Description,
            @Quantity,
            @UnitPrice
        );

        SET @NewInvoiceDetailId = SCOPE_IDENTITY();

        UPDATE Invoices
        SET TotalAmount = dbo.fn_CalculateInvoiceTotal(@InvoiceId)
        WHERE InvoiceId = @InvoiceId;

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
            @CreatedBy,
            'ADD_INVOICE_DETAIL',
            'InvoiceDetails',
            @NewInvoiceDetailId,
            CONCAT(N'Added invoice detail id: ', @NewInvoiceDetailId)
        );

        COMMIT TRANSACTION;

        SELECT @NewInvoiceDetailId AS InvoiceDetailId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   3. Tạo hóa đơn tự động từ Examination
   Bao gồm:
   - Phí khám bác sĩ
   - Dịch vụ đã hoàn tất
   - Thuốc trong đơn thuốc nếu đã có
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CreateInvoiceFromExamination
    @ExaminationId INT,
    @CreatedBy INT = NULL,
    @NewInvoiceId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @PatientId INT;
        DECLARE @DoctorId INT;
        DECLARE @ConsultationFee DECIMAL(18,2);

        SELECT
            @PatientId = a.PatientId,
            @DoctorId = ex.DoctorId,
            @ConsultationFee = d.ConsultationFee
        FROM Examinations ex
        INNER JOIN Appointments a
            ON ex.AppointmentId = a.AppointmentId
        INNER JOIN Doctors d
            ON ex.DoctorId = d.DoctorId
        WHERE ex.ExaminationId = @ExaminationId;

        IF @PatientId IS NULL
        BEGIN
            THROW 50508, N'Phiếu khám không tồn tại.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Invoices WITH (UPDLOCK, HOLDLOCK)
            WHERE ExaminationId = @ExaminationId
              AND Status <> 'Cancelled'
        )
        BEGIN
            THROW 50509, N'Phiếu khám này đã có hóa đơn.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Prescriptions WITH (UPDLOCK, HOLDLOCK)
            WHERE ExaminationId = @ExaminationId
              AND Status = 'Pending'
        )
        BEGIN
            THROW 50516, N'Don thuoc chua duoc cap phat, chua the tao hoa don.', 1;
        END;

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
            @PatientId,
            @ExaminationId,
            0,
            'Unpaid',
            @CreatedBy
        );

        SET @NewInvoiceId = SCOPE_IDENTITY();

        /* 1. Phí khám */
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
            @NewInvoiceId,
            'Consultation',
            @DoctorId,
            N'Phí khám bác sĩ',
            1,
            ISNULL(@ConsultationFee, 0)
        );

        /* 2. Dịch vụ đã hoàn tất */
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
            @NewInvoiceId,
            'Service',
            sv.ServiceId,
            sv.ServiceName,
            so.Quantity,
            sv.Price
        FROM ServiceOrders so
        INNER JOIN Services sv
            ON so.ServiceId = sv.ServiceId
        WHERE so.ExaminationId = @ExaminationId
          AND so.Status = 'Completed';

        /* 3. Thuốc trong đơn thuốc */
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
            @NewInvoiceId,
            'Medicine',
            m.MedicineId,
            m.MedicineName,
            pd.Quantity,
            m.Price
        FROM Prescriptions pr
        INNER JOIN PrescriptionDetails pd
            ON pr.PrescriptionId = pd.PrescriptionId
        INNER JOIN Medicines m
            ON pd.MedicineId = m.MedicineId
        WHERE pr.ExaminationId = @ExaminationId
          AND pr.Status = 'Dispensed';

        UPDATE Invoices
        SET TotalAmount = dbo.fn_CalculateInvoiceTotal(@NewInvoiceId)
        WHERE InvoiceId = @NewInvoiceId;

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
            @CreatedBy,
            'CREATE_INVOICE_FROM_EXAMINATION',
            'Invoices',
            @NewInvoiceId,
            CONCAT(N'Created invoice from examination id: ', @ExaminationId)
        );

        COMMIT TRANSACTION;

        SELECT @NewInvoiceId AS InvoiceId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   4. Lấy chi tiết hóa đơn
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetInvoiceDetail
    @InvoiceId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        i.InvoiceId,
        i.PatientId,
        p.PatientCode,
        p.FullName AS PatientName,
        p.Phone AS PatientPhone,
        i.ExaminationId,
        i.TotalAmount,
        i.Status,
        i.CreatedAt,
        i.PaidAt
    FROM Invoices i
    INNER JOIN Patients p
        ON i.PatientId = p.PatientId
    WHERE i.InvoiceId = @InvoiceId;

    SELECT
        InvoiceDetailId,
        InvoiceId,
        ItemType,
        ItemId,
        Description,
        Quantity,
        UnitPrice,
        Amount
    FROM InvoiceDetails
    WHERE InvoiceId = @InvoiceId
    ORDER BY InvoiceDetailId;

    SELECT
        PaymentId,
        InvoiceId,
        Amount,
        PaymentMethod,
        PaidBy,
        PaidAt,
        Note
    FROM Payments
    WHERE InvoiceId = @InvoiceId
    ORDER BY PaidAt;
END;
GO


/* =========================================================
   5. Lấy danh sách hóa đơn chưa thanh toán
   Dùng cho UI thu ngân
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetUnpaidInvoices
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_Cashier_UnpaidInvoices
    ORDER BY CreatedAt DESC;
END;
GO


/* =========================================================
   6. Thanh toán hóa đơn
   Quan trọng:
   - Ghi Payments
   - Update Invoices.Status = Paid
   - Cả hai cùng transaction
   ========================================================= */
/* =========================================================
   5b. Lay danh sach hoa don theo trang thai
   Dung cho lich su hoa don cua thu ngan
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_GetInvoices
    @Status NVARCHAR(50) = NULL,
    @PatientKeyword NVARCHAR(100) = NULL,
    @DateFrom DATE = NULL,
    @DateTo DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        i.InvoiceId,
        i.PatientId,
        p.PatientCode,
        p.FullName AS PatientName,
        p.Phone AS PatientPhone,
        i.ExaminationId,
        i.TotalAmount,
        i.Status,
        i.CreatedAt,
        i.PaidAt,
        pay.PaymentMethod,
        pay.PaidBy,
        paidUser.FullName AS PaidByName,
        COUNT(id.InvoiceDetailId) AS TotalItems
    FROM Invoices i
    INNER JOIN Patients p
        ON i.PatientId = p.PatientId
    LEFT JOIN InvoiceDetails id
        ON i.InvoiceId = id.InvoiceId
    OUTER APPLY (
        SELECT TOP 1
            pm.PaymentMethod,
            pm.PaidBy,
            pm.PaidAt
        FROM Payments pm
        WHERE pm.InvoiceId = i.InvoiceId
        ORDER BY pm.PaidAt DESC, pm.PaymentId DESC
    ) pay
    LEFT JOIN Users paidUser
        ON pay.PaidBy = paidUser.UserId
    WHERE
        (@Status IS NULL OR @Status = 'All' OR i.Status = @Status)
        AND (
            @PatientKeyword IS NULL
            OR p.FullName LIKE N'%' + @PatientKeyword + N'%'
            OR p.Phone LIKE N'%' + @PatientKeyword + N'%'
            OR p.PatientCode LIKE N'%' + @PatientKeyword + N'%'
            OR CAST(i.InvoiceId AS NVARCHAR(30)) = @PatientKeyword
        )
        AND (@DateFrom IS NULL OR CAST(i.CreatedAt AS DATE) >= @DateFrom)
        AND (@DateTo IS NULL OR CAST(i.CreatedAt AS DATE) <= @DateTo)
    GROUP BY
        i.InvoiceId,
        i.PatientId,
        p.PatientCode,
        p.FullName,
        p.Phone,
        i.ExaminationId,
        i.TotalAmount,
        i.Status,
        i.CreatedAt,
        i.PaidAt,
        pay.PaymentMethod,
        pay.PaidBy,
        paidUser.FullName
    ORDER BY i.CreatedAt DESC;
END;
GO


CREATE OR ALTER PROCEDURE dbo.sp_PayInvoice
    @InvoiceId INT,
    @Amount DECIMAL(18,2),
    @PaymentMethod NVARCHAR(50),
    @PaidBy INT = NULL,
    @Note NVARCHAR(255) = NULL,
    @NewPaymentId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TotalAmount DECIMAL(18,2);
        DECLARE @Status NVARCHAR(50);

        SELECT
            @TotalAmount = TotalAmount,
            @Status = Status
        FROM Invoices WITH (UPDLOCK, HOLDLOCK)
        WHERE InvoiceId = @InvoiceId;

        IF @TotalAmount IS NULL
        BEGIN
            THROW 50510, N'Hóa đơn không tồn tại.', 1;
        END;

        IF @Status <> 'Unpaid'
        BEGIN
            THROW 50511, N'Hóa đơn không còn ở trạng thái Unpaid.', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM Invoices i
            INNER JOIN Prescriptions pr
                ON pr.ExaminationId = i.ExaminationId
            WHERE i.InvoiceId = @InvoiceId
              AND pr.Status = 'Pending'
        )
        BEGIN
            THROW 50516, N'Don thuoc chua duoc cap phat, chua the thanh toan hoa don.', 1;
        END;

        IF @Amount <= 0
        BEGIN
            THROW 50512, N'Số tiền thanh toán phải lớn hơn 0.', 1;
        END;

        IF @Amount <> @TotalAmount
        BEGIN
            THROW 50513, N'Số tiền thanh toán không khớp tổng hóa đơn.', 1;
        END;

        IF @PaymentMethod NOT IN ('Cash', 'Card', 'BankTransfer', 'EWallet')
        BEGIN
            THROW 50514, N'Phương thức thanh toán không hợp lệ.', 1;
        END;

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
            @InvoiceId,
            @Amount,
            @PaymentMethod,
            @PaidBy,
            @Note
        );

        SET @NewPaymentId = SCOPE_IDENTITY();

        UPDATE Invoices
        SET
            Status = 'Paid',
            PaidAt = SYSDATETIME()
        WHERE InvoiceId = @InvoiceId;

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
            @PaidBy,
            'PAY_INVOICE',
            'Invoices',
            @InvoiceId,
            CONCAT(N'Paid invoice id: ', @InvoiceId, N', amount: ', @Amount)
        );

        COMMIT TRANSACTION;

        SELECT @NewPaymentId AS PaymentId;

        EXEC dbo.sp_GetInvoiceDetail @InvoiceId = @InvoiceId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO


/* =========================================================
   7. Hủy hóa đơn chưa thanh toán
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_CancelInvoice
    @InvoiceId INT,
    @CancelledBy INT = NULL,
    @Reason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM Invoices WITH (UPDLOCK, HOLDLOCK)
            WHERE InvoiceId = @InvoiceId
              AND Status = 'Unpaid'
        )
        BEGIN
            THROW 50515, N'Hóa đơn không tồn tại hoặc không thể hủy.', 1;
        END;

        UPDATE Invoices
        SET Status = 'Cancelled'
        WHERE InvoiceId = @InvoiceId;

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
            @CancelledBy,
            'CANCEL_INVOICE',
            'Invoices',
            @InvoiceId,
            CONCAT(N'Cancelled invoice id: ', @InvoiceId, N'. Reason: ', ISNULL(@Reason, N''))
        );

        COMMIT TRANSACTION;

        SELECT @InvoiceId AS InvoiceId, 'Cancelled' AS Status;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO
