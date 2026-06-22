require('dotenv').config({path: './.env'});
const sql = require('mssql');
const fs = require('fs');

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
        
        let out = '';
        
        // 1. Columns for Invoices, InvoiceDetails, Payments, ServiceOrders, Services
        out += '--- Table Columns ---\n';
        const tables = "'Invoices', 'InvoiceDetails', 'Payments', 'ServiceOrders', 'Services'";
        let r1 = await sql.query(`SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN (${tables}) ORDER BY TABLE_NAME, ORDINAL_POSITION;`);
        out += JSON.stringify(r1.recordset, null, 2) + '\n';

        // 2. Stored Procedures
        const procs = [
            'sp_CreateInvoice',
            'sp_CreateInvoiceFromExamination',
            'sp_GetUnpaidInvoices',
            'sp_GetInvoiceDetail',
            'sp_PayInvoice',
            'sp_CancelInvoice'
        ];

        for (const p of procs) {
            out += `\n--- ${p} ---\n`;
            try {
                let r = await sql.query(`EXEC sp_helptext '${p}';`);
                out += r.recordset.map(row => row.Text).join('');
            } catch (err) {
                out += `Error getting helptext for ${p}: ${err.message}\n`;
            }
        }
        
        fs.writeFileSync('invoices_db_out.txt', out);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
