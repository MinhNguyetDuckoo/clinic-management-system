USE ClinicManagementDB;
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Cancelled TABLE
    (
        InvoiceId INT,
        ExaminationId INT
    );

    UPDATE i
    SET Status = 'Cancelled'
    OUTPUT inserted.InvoiceId, inserted.ExaminationId
        INTO @Cancelled (InvoiceId, ExaminationId)
    FROM Invoices i
    WHERE i.Status = 'Unpaid'
      AND EXISTS (
          SELECT 1
          FROM Prescriptions pr
          WHERE pr.ExaminationId = i.ExaminationId
            AND pr.Status = 'Pending'
      );

    INSERT INTO AuditLogs
    (
        UserId,
        Action,
        TableName,
        RecordId,
        NewData
    )
    SELECT
        NULL,
        'CANCEL_INVOICE_PENDING_PRESCRIPTION',
        'Invoices',
        c.InvoiceId,
        CONCAT(N'Cancelled unpaid invoice ', c.InvoiceId, N' because examination ', c.ExaminationId, N' has pending prescription.')
    FROM @Cancelled c;

    SELECT COUNT(*) AS CancelledInvoiceCount
    FROM @Cancelled;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
