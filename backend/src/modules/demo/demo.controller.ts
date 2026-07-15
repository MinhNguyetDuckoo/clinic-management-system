import { Request, Response } from "express";
import { getDbPool } from "../../config/database";

// 1. LOST UPDATE
export async function lostUpdateA(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    await pool.request().query(`UPDATE Medicines SET StockQuantity = 50 WHERE MedicineId = 1`);
    
    await pool.request().query(`
      BEGIN TRAN;
      DECLARE @Stock INT;
      SELECT @Stock = StockQuantity FROM Medicines WHERE MedicineId = 1;
      WAITFOR DELAY '00:00:05'; 
      UPDATE Medicines SET StockQuantity = @Stock - 10 WHERE MedicineId = 1;
      COMMIT;
    `);
    res.json({ message: "Bác sĩ A lấy 10ml thành công" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function lostUpdateB(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    await pool.request().query(`
      BEGIN TRAN;
      DECLARE @Stock INT;
      SELECT @Stock = StockQuantity FROM Medicines WHERE MedicineId = 1;
      UPDATE Medicines SET StockQuantity = @Stock - 15 WHERE MedicineId = 1;
      COMMIT;
    `);
    res.json({ message: "Bác sĩ B lấy 15ml thành công" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// 2. DIRTY READ
export async function dirtyReadUpdate(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    await pool.request().query(`
      BEGIN TRAN;
      UPDATE Medicines SET Price = 250000 WHERE MedicineId = 1;
      WAITFOR DELAY '00:00:05';
      ROLLBACK;
    `);
    res.json({ message: "Đã hủy cập nhật giá (Rollback)" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function dirtyReadSelect(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
      BEGIN TRAN;
      SELECT Price FROM Medicines WHERE MedicineId = 1;
      COMMIT;
    `);
    res.json({ message: "Đã in hóa đơn", price: result.recordset[0]?.Price });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// 3. UNREPEATABLE READ
export async function unrepeatableReadSelect(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
      BEGIN TRAN;
      DECLARE @TamTinh DECIMAL(18,2);
      DECLARE @Chot DECIMAL(18,2);
      SELECT @TamTinh = Price FROM Medicines WHERE MedicineId = 2;
      WAITFOR DELAY '00:00:05';
      SELECT @Chot = Price FROM Medicines WHERE MedicineId = 2;
      COMMIT;
      SELECT @TamTinh AS TamTinh, @Chot AS Chot;
    `);
    res.json(result.recordset[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function unrepeatableReadUpdate(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    await pool.request().query(`
      BEGIN TRAN;
      UPDATE Medicines SET Price = Price + 50000 WHERE MedicineId = 2;
      COMMIT;
    `);
    res.json({ message: "Đã đổi giá thành công" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// 4. PHANTOM READ
export async function phantomReadA(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; 
      BEGIN TRAN;
      DECLARE @Count INT;
      SELECT @Count = COUNT(*) FROM Appointments WHERE AppointmentDate = '2023-10-10';
      WAITFOR DELAY '00:00:05';
      IF @Count < 5 
        INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, Status, AppointmentTime) 
        VALUES (1, 1, '2023-10-10', 'Pending', '10:00');
      COMMIT;
      SELECT @Count AS InitialCount;
    `);
    res.json({ message: "Lễ tân 1 đã thêm lịch", initialCount: result.recordset[0]?.InitialCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function phantomReadB(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      BEGIN TRAN;
      DECLARE @Count INT;
      SELECT @Count = COUNT(*) FROM Appointments WHERE AppointmentDate = '2023-10-10';
      IF @Count < 5 
        INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, Status, AppointmentTime) 
        VALUES (2, 1, '2023-10-10', 'Pending', '10:15');
      COMMIT;
      SELECT @Count AS InitialCount;
    `);
    res.json({ message: "Lễ tân 2 đã thêm lịch", initialCount: result.recordset[0]?.InitialCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function resetDemoData(req: Request, res: Response) {
  try {
    const pool = await getDbPool();
    await pool.request().query(`
      UPDATE Medicines SET StockQuantity = 50, Price = 100000 WHERE MedicineId = 1;
      UPDATE Medicines SET Price = 200000 WHERE MedicineId = 2;
      DELETE FROM Appointments WHERE AppointmentDate = '2023-10-10';
      INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, Status, AppointmentTime) 
      VALUES (1, 1, '2023-10-10', 'Pending', '08:00'), (2, 1, '2023-10-10', 'Pending', '08:30'),
             (3, 1, '2023-10-10', 'Pending', '09:00'), (4, 1, '2023-10-10', 'Pending', '09:30');
    `);
    res.json({ message: "Reset dữ liệu thành công" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
