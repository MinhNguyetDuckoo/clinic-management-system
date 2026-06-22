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
        
        console.log('--- TOP 20 INVOICES ---');
        let r1 = await sql.query("SELECT TOP 20 InvoiceId, PatientId, ExaminationId, TotalAmount, Status, CreatedAt, PaidAt FROM Invoices ORDER BY InvoiceId DESC;");
        console.table(r1.recordset);

        console.log('--- TOP 20 INVOICE DETAILS ---');
        let r2 = await sql.query("SELECT TOP 20 InvoiceDetailId, InvoiceId, ItemType, Description, Quantity, UnitPrice, Amount FROM InvoiceDetails ORDER BY InvoiceDetailId DESC;");
        console.table(r2.recordset);

        console.log('--- TOP 20 PAYMENTS ---');
        let r3 = await sql.query("SELECT TOP 20 PaymentId, InvoiceId, Amount, PaymentMethod, PaidBy, PaidAt, Note FROM Payments ORDER BY PaymentId DESC;");
        console.table(r3.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
