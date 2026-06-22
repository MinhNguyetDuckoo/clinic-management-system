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
        
        // Views
        out += '--- vw_Manager_RevenueByDay ---\n';
        let r1 = await sql.query(`SELECT TOP 1 * FROM vw_Manager_RevenueByDay;`);
        out += JSON.stringify(r1.recordset, null, 2) + '\n';
        
        out += '--- vw_Manager_MedicineStockStatus ---\n';
        let r2 = await sql.query(`SELECT TOP 1 * FROM vw_Manager_MedicineStockStatus;`);
        out += JSON.stringify(r2.recordset, null, 2) + '\n';

        fs.writeFileSync('manager_db_out.txt', out);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
