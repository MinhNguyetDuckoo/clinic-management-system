USE ClinicManagementDB;
GO

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @PatientId INT;
DECLARE @DoctorId INT;
DECLARE @RoomId INT;
DECLARE @CreatedBy INT;
DECLARE @NewAppointmentId INT;
DECLARE @NewExaminationId INT;

SELECT @PatientId = PatientId
FROM Patients
WHERE PatientCode = 'PAT003';

SELECT TOP 1 @DoctorId = DoctorId
FROM Doctors
ORDER BY DoctorId;

SELECT @RoomId = RoomId
FROM Rooms
WHERE RoomName = N'Phòng khám 101';

SELECT @CreatedBy = UserId
FROM Users
WHERE Username = 'letan';


/* 1. Tạo lịch mới lúc 10:00 */
EXEC dbo.sp_CreateAppointment
    @PatientId = @PatientId,
    @DoctorId = @DoctorId,
    @RoomId = @RoomId,
    @AppointmentDate = @Today,
    @AppointmentTime = '10:00',
    @Reason = N'Test đặt lịch bằng stored procedure',
    @CreatedBy = @CreatedBy,
    @NewAppointmentId = @NewAppointmentId OUTPUT;

SELECT @NewAppointmentId AS NewAppointmentId;


/* 2. Xem lịch hôm nay */
EXEC dbo.sp_GetAppointmentsByDate
    @AppointmentDate = @Today;


/* 3. Check-in lịch vừa tạo */
EXEC dbo.sp_CheckInPatient
    @AppointmentId = @NewAppointmentId,
    @CheckedInBy = @CreatedBy,
    @NewExaminationId = @NewExaminationId OUTPUT;

SELECT @NewExaminationId AS NewExaminationId;


/* 4. Xem hàng chờ bác sĩ */
SELECT *
FROM vw_Doctor_TodayQueue;


/* 5. Test trùng lịch bác sĩ lúc 10:00
   Đoạn này phải lỗi:
   Bác sĩ đã có lịch hẹn vào thời gian này.
*/
DECLARE @AnotherAppointmentId INT;

EXEC dbo.sp_CreateAppointment
    @PatientId = @PatientId,
    @DoctorId = @DoctorId,
    @RoomId = @RoomId,
    @AppointmentDate = @Today,
    @AppointmentTime = '10:00',
    @Reason = N'Test trùng lịch',
    @CreatedBy = @CreatedBy,
    @NewAppointmentId = @AnotherAppointmentId OUTPUT;
GO