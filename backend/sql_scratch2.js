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
        const fs = require('fs');
        
        let out = '';
        out += '--- Medicines Table Columns ---\n';
        let r1 = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Medicines' ORDER BY ORDINAL_POSITION;");
        out += JSON.stringify(r1.recordset, null, 2) + '\n';

        out += '--- sp_CreatePrescription ---\n';
        let r2 = await sql.query("EXEC sp_helptext 'sp_CreatePrescription';");
        out += r2.recordset.map(r => r.Text).join('') + '\n';
        
        fs.writeFileSync('db_out.txt', out);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
