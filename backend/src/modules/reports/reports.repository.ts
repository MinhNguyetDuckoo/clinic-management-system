import { getDbPool } from "../../config/database";

export async function getRevenueByDay() {
  const pool = await getDbPool();

  const result = await pool.request().query(`
    SELECT 
      RevenueDate,
      TotalPaidInvoices,
      TotalRevenue
    FROM vw_Manager_RevenueByDay
    ORDER BY RevenueDate DESC
  `);

  return result.recordset;
}

export async function getMedicineStockStatus() {
  const pool = await getDbPool();

  const result = await pool.request().query(`
    SELECT
      MedicineId,
      MedicineName,
      Unit,
      StockQuantity,
      MinStockQuantity,
      Price,
      CategoryName,
      StockStatus
    FROM vw_Manager_MedicineStockStatus
    ORDER BY 
      CASE 
        WHEN StockStatus = 'OutOfStock' THEN 1
        WHEN StockStatus = 'LowStock' THEN 2
        ELSE 3
      END,
      MedicineName
  `);

  return result.recordset;
}