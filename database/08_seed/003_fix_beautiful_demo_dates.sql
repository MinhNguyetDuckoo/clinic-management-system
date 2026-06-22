USE ClinicManagementDB;
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @DemoDate DATE = '2026-05-03';
    DECLARE @DemoStockInDate DATE = '2026-05-01';

    UPDATE ds
    SET WorkDate = @DemoDate
    FROM DoctorSchedules ds
    INNER JOIN Doctors d ON ds.DoctorId = d.DoctorId
    WHERE d.LicenseNumber LIKE 'DEMO-BEAUTY-%'
      AND ds.WorkDate > @DemoDate;

    UPDATE a
    SET AppointmentDate = @DemoDate
    FROM Appointments a
    INNER JOIN Patients p ON a.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND a.AppointmentDate > @DemoDate;

    UPDATE ex
    SET
        CreatedAt = DATEADD(DAY, DATEDIFF(DAY, CAST(ex.CreatedAt AS DATE), @DemoDate), ex.CreatedAt),
        StartedAt = CASE
            WHEN ex.StartedAt IS NULL THEN NULL
            ELSE DATEADD(DAY, DATEDIFF(DAY, CAST(ex.StartedAt AS DATE), @DemoDate), ex.StartedAt)
        END,
        FinishedAt = CASE
            WHEN ex.FinishedAt IS NULL THEN NULL
            ELSE DATEADD(DAY, DATEDIFF(DAY, CAST(ex.FinishedAt AS DATE), @DemoDate), ex.FinishedAt)
        END
    FROM Examinations ex
    INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p ON a.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND CAST(ex.CreatedAt AS DATE) > @DemoDate;

    UPDATE so
    SET
        OrderedAt = DATEADD(DAY, DATEDIFF(DAY, CAST(so.OrderedAt AS DATE), @DemoDate), so.OrderedAt),
        CompletedAt = CASE
            WHEN so.CompletedAt IS NULL THEN NULL
            ELSE DATEADD(DAY, DATEDIFF(DAY, CAST(so.CompletedAt AS DATE), @DemoDate), so.CompletedAt)
        END
    FROM ServiceOrders so
    INNER JOIN Examinations ex ON so.ExaminationId = ex.ExaminationId
    INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p ON a.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND CAST(so.OrderedAt AS DATE) > @DemoDate;

    UPDATE pr
    SET
        CreatedAt = DATEADD(DAY, DATEDIFF(DAY, CAST(pr.CreatedAt AS DATE), @DemoDate), pr.CreatedAt),
        DispensedAt = CASE
            WHEN pr.DispensedAt IS NULL THEN NULL
            ELSE DATEADD(DAY, DATEDIFF(DAY, CAST(pr.DispensedAt AS DATE), @DemoDate), pr.DispensedAt)
        END
    FROM Prescriptions pr
    INNER JOIN Examinations ex ON pr.ExaminationId = ex.ExaminationId
    INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p ON a.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND CAST(pr.CreatedAt AS DATE) > @DemoDate;

    UPDATE it
    SET CreatedAt = DATEADD(DAY, DATEDIFF(DAY, CAST(it.CreatedAt AS DATE), @DemoStockInDate), it.CreatedAt)
    FROM InventoryTransactions it
    WHERE it.ReferenceType = 'DEMO_BEAUTY_SEED'
      AND CAST(it.CreatedAt AS DATE) > @DemoStockInDate;

    UPDATE it
    SET CreatedAt = DATEADD(DAY, DATEDIFF(DAY, CAST(it.CreatedAt AS DATE), @DemoDate), it.CreatedAt)
    FROM InventoryTransactions it
    INNER JOIN Prescriptions pr ON it.ReferenceType = 'Prescription' AND it.ReferenceId = pr.PrescriptionId
    INNER JOIN Examinations ex ON pr.ExaminationId = ex.ExaminationId
    INNER JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
    INNER JOIN Patients p ON a.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND it.TransactionType = 'OUT'
      AND CAST(it.CreatedAt AS DATE) > @DemoDate;

    UPDATE i
    SET
        CreatedAt = DATEADD(DAY, DATEDIFF(DAY, CAST(i.CreatedAt AS DATE), @DemoDate), i.CreatedAt),
        PaidAt = CASE
            WHEN i.PaidAt IS NULL THEN NULL
            ELSE DATEADD(DAY, DATEDIFF(DAY, CAST(i.PaidAt AS DATE), @DemoDate), i.PaidAt)
        END
    FROM Invoices i
    INNER JOIN Patients p ON i.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND CAST(i.CreatedAt AS DATE) > @DemoDate;

    UPDATE pay
    SET PaidAt = DATEADD(DAY, DATEDIFF(DAY, CAST(pay.PaidAt AS DATE), @DemoDate), pay.PaidAt)
    FROM Payments pay
    INNER JOIN Invoices i ON pay.InvoiceId = i.InvoiceId
    INNER JOIN Patients p ON i.PatientId = p.PatientId
    WHERE p.PatientCode LIKE 'DEMO-BEAUTY-%'
      AND CAST(pay.PaidAt AS DATE) > @DemoDate;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
