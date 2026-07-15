-- SESSION B (QUẢN TRỊ VIÊN): Non-Repeatable Read (Lỗi đọc không thể lặp lại)
-- Kịch bản (Slide): Quản trị viên cập nhật lại bảng giá chung, 
-- đổi giá Chụp X-Quang thành 250.000đ và COMMIT thành công.

USE ClinicManagementDB;
GO

BEGIN TRAN;

    PRINT N'=================================================';
    PRINT N'[BƯỚC 2] Admin đang tiến hành cập nhật bảng giá chung...';
    
    -- Cập nhật giá dịch vụ ID 3 (Chụp X-Quang) thành 250k
    UPDATE Services 
    SET Price = 40000 
    WHERE ServiceId = 3;

    PRINT N'>> Đã sửa giá Chụp X-Quang lên 250.000đ thành công!';
    PRINT N'=================================================';

-- Lưu thay đổi vào Database
COMMIT TRAN;
GO
