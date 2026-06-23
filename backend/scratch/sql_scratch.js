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
        
        console.log('--- Medicines Table Columns ---');
        let r1 = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Medicines' ORDER BY ORDINAL_POSITION;");
        console.table(r1.recordset);

        console.log('--- sp_CreatePrescription ---');
        let r2 = await sql.query("EXEC sp_helptext 'sp_CreatePrescription';");
        console.log(r2.recordset.map(r => r.Text).join(''));
        
        console.log('--- sp_AddPrescriptionDetail ---');
        let r3 = await sql.query("EXEC sp_helptext 'sp_AddPrescriptionDetail';");
        console.log(r3.recordset.map(r => r.Text).join(''));
        
        console.log('--- sp_GetPendingPrescriptions ---');
        let r4 = await sql.query("EXEC sp_helptext 'sp_GetPendingPrescriptions';");
        console.log(r4.recordset.map(r => r.Text).join(''));

        console.log('--- sp_GetPrescriptionDetail ---');
        let r5 = await sql.query("EXEC sp_helptext 'sp_GetPrescriptionDetail';");
        console.log(r5.recordset.map(r => r.Text).join(''));

        console.log('--- sp_DispenseMedicine ---');
        let r6 = await sql.query("EXEC sp_helptext 'sp_DispenseMedicine';");
        console.log(r6.recordset.map(r => r.Text).join(''));
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
