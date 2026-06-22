USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @ExaminationId INT;
DECLARE @DoctorUserId INT;
DECLARE @ServiceId INT;
DECLARE @NewServiceOrderId INT;

SELECT @DoctorUserId = UserId
FROM Users
WHERE Username = 'bacsi';

-- Lấy phiếu khám Waiting của PAT003 vừa check-in lúc 10:00
SELECT TOP 1 @ExaminationId = ex.ExaminationId
FROM Examinations ex
JOIN Appointments a ON ex.AppointmentId = a.AppointmentId
JOIN Patients p ON a.PatientId = p.PatientId
WHERE p.PatientCode = 'PAT003'
  AND a.AppointmentDate = @Today
  AND a.AppointmentTime = '10:00'
ORDER BY ex.ExaminationId DESC;

SELECT @ExaminationId AS ExaminationId;


/* 1. Xem chi tiết phiếu khám */
EXEC dbo.sp_GetExaminationDetail
    @ExaminationId = @ExaminationId;


/* 2. Bắt đầu khám */
EXEC dbo.sp_StartExamination
    @ExaminationId = @ExaminationId,
    @DoctorUserId = @DoctorUserId;


/* 3. Lưu chẩn đoán */
EXEC dbo.sp_SaveDiagnosis
    @ExaminationId = @ExaminationId,
    @Symptoms = N'Ho, đau họng, sốt nhẹ',
    @Diagnosis = N'Viêm họng cấp',
    @Conclusion = N'Uống thuốc, nghỉ ngơi, tái khám nếu sốt cao',
    @DoctorUserId = @DoctorUserId;


/* 4. Tạo chỉ định dịch vụ */
SELECT @ServiceId = ServiceId
FROM Services
WHERE ServiceName = N'Xét nghiệm máu';

EXEC dbo.sp_CreateServiceOrder
    @ExaminationId = @ExaminationId,
    @ServiceId = @ServiceId,
    @Quantity = 1,
    @DoctorUserId = @DoctorUserId,
    @NewServiceOrderId = @NewServiceOrderId OUTPUT;

SELECT @NewServiceOrderId AS NewServiceOrderId;


/* 5. Hoàn tất dịch vụ */
EXEC dbo.sp_CompleteServiceOrder
    @ServiceOrderId = @NewServiceOrderId,
    @Result = N'Bạch cầu bình thường, không phát hiện bất thường',
    @CompletedBy = @DoctorUserId;


/* 6. Hoàn tất khám */
EXEC dbo.sp_FinishExamination
    @ExaminationId = @ExaminationId,
    @DoctorUserId = @DoctorUserId;


/* 7. Kiểm tra lại */
EXEC dbo.sp_GetExaminationDetail
    @ExaminationId = @ExaminationId;

SELECT *
FROM vw_Doctor_TodayQueue;
GO