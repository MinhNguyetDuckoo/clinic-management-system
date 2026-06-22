USE ClinicManagementDB;
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE Users
    SET PasswordHash = '123456'
    WHERE Username IN (
        'demo.beauty.receptionist',
        'demo.beauty.pharmacist',
        'demo.beauty.cashier',
        'demo.beauty.dr.noi',
        'demo.beauty.dr.nhi',
        'demo.beauty.dr.tim'
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
