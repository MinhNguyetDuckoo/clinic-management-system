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
        
        console.log('--- TOP 20 PRESCRIPTIONS ---');
        let r1 = await sql.query("SELECT TOP 20 PrescriptionId, ExaminationId, DoctorId, Status, CreatedAt, DispensedAt FROM Prescriptions ORDER BY PrescriptionId DESC;");
        console.table(r1.recordset);

        console.log('--- TOP 20 PRESCRIPTION DETAILS ---');
        let r2 = await sql.query("SELECT TOP 20 PrescriptionDetailId, PrescriptionId, MedicineId, Quantity, Dosage FROM PrescriptionDetails ORDER BY PrescriptionDetailId DESC;");
        console.table(r2.recordset);

        console.log('--- TOP 20 MEDICINES ---');
        let r3 = await sql.query("SELECT TOP 20 MedicineId, MedicineName, Unit, StockQuantity FROM Medicines ORDER BY MedicineId;");
        console.table(r3.recordset);

        console.log('--- TOP 20 INVENTORY TRANSACTIONS ---');
        let r4 = await sql.query("SELECT TOP 20 TransactionId, MedicineId, TransactionType, Quantity, ReferenceType, ReferenceId FROM InventoryTransactions ORDER BY TransactionId DESC;");
        console.table(r4.recordset);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
