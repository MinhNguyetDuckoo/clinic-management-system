USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @ExaminationId INT = 2;
DECLARE @DoctorId INT;
DECLARE @DoctorUserId INT;
DECLARE @PharmacistUserId INT;
DECLARE @PrescriptionId INT;
DECLARE @PrescriptionDetailId INT;
DECLARE @MedicineId1 INT;
DECLARE @MedicineId2 INT;

SELECT @DoctorUserId = UserId
FROM Users
WHERE Username = 'bacsi';

SELECT @PharmacistUserId = UserId
FROM Users
WHERE Username = 'duocsi';

SELECT TOP 1 @DoctorId = DoctorId
FROM Doctors
ORDER BY DoctorId;

SELECT @MedicineId1 = MedicineId
FROM Medicines
WHERE MedicineName = N'Paracetamol 500mg';

SELECT @MedicineId2 = MedicineId
FROM Medicines
WHERE MedicineName = N'Vitamin C 500mg';


/* 1. Tạo đơn thuốc cho ExaminationId = 2 */
EXEC dbo.sp_CreatePrescription
    @ExaminationId = @ExaminationId,
    @DoctorId = @DoctorId,
    @Note = N'Uống thuốc sau ăn, uống nhiều nước',
    @CreatedBy = @DoctorUserId,
    @NewPrescriptionId = @PrescriptionId OUTPUT;

SELECT @PrescriptionId AS PrescriptionId;


/* 2. Thêm Paracetamol */
EXEC dbo.sp_AddPrescriptionDetail
    @PrescriptionId = @PrescriptionId,
    @MedicineId = @MedicineId1,
    @Quantity = 10,
    @Dosage = N'1 viên/lần, ngày 2 lần',
    @UsageInstruction = N'Uống sau ăn sáng và tối',
    @CreatedBy = @DoctorUserId,
    @NewPrescriptionDetailId = @PrescriptionDetailId OUTPUT;


/* 3. Thêm Vitamin C */
EXEC dbo.sp_AddPrescriptionDetail
    @PrescriptionId = @PrescriptionId,
    @MedicineId = @MedicineId2,
    @Quantity = 6,
    @Dosage = N'1 viên/lần, ngày 1 lần',
    @UsageInstruction = N'Uống sau ăn trưa',
    @CreatedBy = @DoctorUserId,
    @NewPrescriptionDetailId = @PrescriptionDetailId OUTPUT;


/* 4. Xem đơn thuốc */
EXEC dbo.sp_GetPrescriptionDetail
    @PrescriptionId = @PrescriptionId;


/* 5. Xem danh sách đơn chờ cấp */
EXEC dbo.sp_GetPendingPrescriptions;


/* 6. Cấp thuốc */
EXEC dbo.sp_DispenseMedicine
    @PrescriptionId = @PrescriptionId,
    @DispensedBy = @PharmacistUserId;


/* 7. Kiểm tra tồn kho sau cấp */
SELECT 
    MedicineId,
    MedicineName,
    StockQuantity
FROM Medicines
WHERE MedicineId IN (@MedicineId1, @MedicineId2);


/* 8. Kiểm tra giao dịch kho */
SELECT *
FROM InventoryTransactions
WHERE ReferenceType = 'Prescription'
  AND ReferenceId = @PrescriptionId;


/* 9. Test cấp lại cùng đơn
   Đoạn này phải lỗi:
   Đơn thuốc không tồn tại hoặc đã được cấp/hủy.
*/
EXEC dbo.sp_DispenseMedicine
    @PrescriptionId = @PrescriptionId,
    @DispensedBy = @PharmacistUserId;
GO