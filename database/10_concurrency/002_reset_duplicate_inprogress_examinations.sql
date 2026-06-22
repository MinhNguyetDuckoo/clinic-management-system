USE ClinicManagementDB;
GO

/*
   Reset du lieu test neu mot bac si dang co nhieu phieu kham InProgress
   trong cung ngay. Giu lai phieu bat dau som nhat, cac phieu con lai dua
   ve Waiting/CheckedIn de bac si chi kham tung nguoi mot.
*/
;WITH RankedInProgress AS (
    SELECT
        ex.ExaminationId,
        ex.AppointmentId,
        ROW_NUMBER() OVER (
            PARTITION BY ex.DoctorId, a.AppointmentDate
            ORDER BY ex.StartedAt ASC, ex.ExaminationId ASC
        ) AS rn
    FROM Examinations ex
    INNER JOIN Appointments a
        ON ex.AppointmentId = a.AppointmentId
    WHERE ex.Status = 'InProgress'
      AND a.AppointmentDate = CAST(GETDATE() AS DATE)
)
UPDATE ex
SET
    Status = 'Waiting',
    StartedAt = NULL,
    UpdatedAt = SYSDATETIME()
FROM Examinations ex
INNER JOIN RankedInProgress r
    ON ex.ExaminationId = r.ExaminationId
WHERE r.rn > 1;

;WITH RankedInProgress AS (
    SELECT
        ex.ExaminationId,
        ex.AppointmentId,
        ROW_NUMBER() OVER (
            PARTITION BY ex.DoctorId, a.AppointmentDate
            ORDER BY ex.StartedAt ASC, ex.ExaminationId ASC
        ) AS rn
    FROM Examinations ex
    INNER JOIN Appointments a
        ON ex.AppointmentId = a.AppointmentId
    WHERE ex.Status = 'InProgress'
      AND a.AppointmentDate = CAST(GETDATE() AS DATE)
)
UPDATE a
SET
    Status = 'CheckedIn',
    UpdatedAt = SYSDATETIME()
FROM Appointments a
INNER JOIN RankedInProgress r
    ON a.AppointmentId = r.AppointmentId
WHERE r.rn > 1;
GO
