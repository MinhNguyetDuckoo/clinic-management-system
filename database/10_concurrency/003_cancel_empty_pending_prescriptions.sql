USE ClinicManagementDB;
GO

/*
   Huy cac don thuoc Pending khong co dong thuoc nao.
   Dung de don du lieu test khi bac si da bam luu don nhung chi tao duoc
   header don thuoc rong, lam cac lan ke don sau bi chan.
*/
UPDATE pr
SET Status = 'Cancelled'
FROM Prescriptions pr
WHERE pr.Status = 'Pending'
  AND NOT EXISTS (
      SELECT 1
      FROM PrescriptionDetails pd
      WHERE pd.PrescriptionId = pr.PrescriptionId
  );
GO
