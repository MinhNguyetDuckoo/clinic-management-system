require('dotenv').config({path: './.env'});
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_DATABASE,
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);
        
        const result = await sql.query(`
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
        console.table(result.recordset);
        process.exit(0);
    } catch(e) {
        console.error("SQL Error:", e.message);
        process.exit(1);
    }
}
run();
