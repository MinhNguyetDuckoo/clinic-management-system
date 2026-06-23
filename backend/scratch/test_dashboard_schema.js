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
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('Patients', 'Doctors', 'Medicines')
            AND COLUMN_NAME IN ('IsDeleted', 'IsActive');
        `);
        console.table(result.recordset);
        process.exit(0);
    } catch(e) {
        console.error("SQL Error:", e.message);
        process.exit(1);
    }
}
run();
