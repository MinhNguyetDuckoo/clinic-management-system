const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'yourStrong(!)Password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'ClinicManagementDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);
        
        console.log("--- Schema ---");
        const schema = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME IN ('Users', 'Roles', 'UserRoles', 'Employees', 'Doctors', 'Patients', 'AuditLogs', 'LoginHistories')
            ORDER BY TABLE_NAME, ORDINAL_POSITION;
        `);
        console.table(schema.recordset);

        console.log("--- sp_CreateUser ---");
        try {
            const sp1 = await pool.request().query(`EXEC sp_helptext 'sp_CreateUser'`);
            console.log(sp1.recordset.map(r => r.Text).join(''));
        } catch (e) { console.log('Not found or error:', e.message); }

        console.log("--- sp_AssignRole ---");
        try {
            const sp2 = await pool.request().query(`EXEC sp_helptext 'sp_AssignRole'`);
            console.log(sp2.recordset.map(r => r.Text).join(''));
        } catch (e) { console.log('Not found or error:', e.message); }

        console.log("--- sp_GetUserByUsername ---");
        try {
            const sp3 = await pool.request().query(`EXEC sp_helptext 'sp_GetUserByUsername'`);
            console.log(sp3.recordset.map(r => r.Text).join(''));
        } catch (e) { console.log('Not found or error:', e.message); }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
