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
        
        console.log('--- TOP 20 vw_Manager_RevenueByDay ---');
        let r1 = await sql.query("SELECT TOP 20 * FROM vw_Manager_RevenueByDay;");
        console.table(r1.recordset);

        console.log('--- TOP 20 vw_Manager_MedicineStockStatus ---');
        let r2 = await sql.query("SELECT TOP 20 * FROM vw_Manager_MedicineStockStatus;");
        console.table(r2.recordset);

        console.log('--- COUNT PAID INVOICES ---');
        let r3 = await sql.query("SELECT COUNT(*) AS PaidInvoices FROM Invoices WHERE Status = 'Paid';");
        console.table(r3.recordset);
        
        console.log('--- COUNT UNPAID INVOICES ---');
        let r4 = await sql.query("SELECT COUNT(*) AS UnpaidInvoices FROM Invoices WHERE Status = 'Unpaid';");
        console.table(r4.recordset);

        console.log('--- TODAY REVENUE FROM PAYMENTS ---');
        let r5 = await sql.query("SELECT SUM(Amount) AS TodayRevenue FROM Payments WHERE CAST(PaidAt AS DATE) = CAST(GETDATE() AS DATE);");
        console.table(r5.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
