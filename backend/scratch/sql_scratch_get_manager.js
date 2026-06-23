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
        
        let r1 = await sql.query("SELECT u.Username, u.Email, r.RoleName FROM Users u JOIN UserRoles ur ON u.UserId = ur.UserId JOIN Roles r ON ur.RoleId = r.RoleId WHERE r.RoleName = 'Manager';");
        console.table(r1.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
