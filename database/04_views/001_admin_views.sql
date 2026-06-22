USE ClinicManagementDB;
GO

CREATE OR ALTER VIEW vw_Admin_UserList
AS
SELECT
    u.UserId,
    u.Username,
    u.FullName,
    u.Email,
    u.Phone,
    u.IsActive,
    u.IsDeleted,
    STRING_AGG(r.RoleName, ', ') AS Roles,
    u.CreatedAt,
    u.UpdatedAt
FROM Users u
LEFT JOIN UserRoles ur 
    ON u.UserId = ur.UserId
LEFT JOIN Roles r 
    ON ur.RoleId = r.RoleId
GROUP BY
    u.UserId,
    u.Username,
    u.FullName,
    u.Email,
    u.Phone,
    u.IsActive,
    u.IsDeleted,
    u.CreatedAt,
    u.UpdatedAt;
GO