USE ClinicManagementDB;
GO

DECLARE @NewUserId INT;

EXEC dbo.sp_CreateUser
    @Username = 'testuser',
    @PasswordHash = 'demo_hash_123',
    @FullName = N'Người Dùng Test',
    @Email = 'testuser@clinic.local',
    @Phone = '0999999999',
    @NewUserId = @NewUserId OUTPUT;

SELECT @NewUserId AS NewUserId;

EXEC dbo.sp_AssignRole
    @UserId = @NewUserId,
    @RoleName = 'Patient';

EXEC dbo.sp_GetUserByUsername
    @Username = 'testuser';

SELECT * FROM vw_Admin_UserList
WHERE Username = 'testuser';
GO