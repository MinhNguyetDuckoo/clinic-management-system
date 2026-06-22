import { getDbPool } from "../../config/database";

export async function getDashboardSummary() {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    DECLARE @todayRevenue DECIMAL(18,2) = (SELECT ISNULL(SUM(Amount), 0) FROM Payments WHERE CAST(PaidAt AS DATE) = CAST(GETDATE() AS DATE));
    DECLARE @paidInvoices INT = (SELECT COUNT(*) FROM Invoices WHERE Status = 'Paid');
    DECLARE @unpaidInvoices INT = (SELECT COUNT(*) FROM Invoices WHERE Status = 'Unpaid');
    DECLARE @todayAppointments INT = (SELECT COUNT(*) FROM Appointments WHERE CAST(AppointmentDate AS DATE) = CAST(GETDATE() AS DATE));
    DECLARE @totalPatients INT = (SELECT COUNT(*) FROM Patients WHERE IsDeleted = 0);
    DECLARE @totalDoctors INT = (SELECT COUNT(*) FROM Doctors WHERE IsActive = 1);
    DECLARE @pendingPrescriptions INT = (SELECT COUNT(*) FROM Prescriptions WHERE Status = 'Pending');
    DECLARE @lowStockMedicines INT = (SELECT COUNT(*) FROM Medicines WHERE StockQuantity <= MinStockQuantity AND IsActive = 1 AND IsDeleted = 0);

    SELECT 
        @todayRevenue AS todayRevenue,
        @paidInvoices AS paidInvoices,
        @unpaidInvoices AS unpaidInvoices,
        @todayAppointments AS todayAppointments,
        @totalPatients AS totalPatients,
        @totalDoctors AS totalDoctors,
        @pendingPrescriptions AS pendingPrescriptions,
        @lowStockMedicines AS lowStockMedicines;
  `);
  
  return result.recordset[0];
}

export async function getRevenueByDay() {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT RevenueDate, TotalPaidInvoices, TotalRevenue 
    FROM vw_Manager_RevenueByDay 
    ORDER BY RevenueDate DESC;
  `);
  return result.recordset;
}

export async function getMedicineStockStatus() {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT MedicineId, MedicineName, Unit, StockQuantity, MinStockQuantity, Price, CategoryName, StockStatus 
    FROM vw_Manager_MedicineStockStatus;
  `);
  return result.recordset;
}
