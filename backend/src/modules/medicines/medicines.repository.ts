import { getDbPool, sql } from "../../config/database";

export interface MedicineListFilters {
  includeInactive?: boolean;
}

export interface CreateMedicineInput {
  medicineName: string;
  categoryId: number;
  unit: string;
  price: number;
  stockQuantity: number;
  minStockQuantity: number;
  isActive: boolean;
}

export interface UpdateMedicineInput {
  medicineName: string;
  categoryId: number;
  unit: string;
  price: number;
  minStockQuantity: number;
  isActive: boolean;
}

export interface StockAdjustmentInput {
  type: "IN" | "ADJUST";
  quantity: number;
  note?: string | null;
  createdBy?: number | null;
}

export async function getMedicines(filters: MedicineListFilters = {}) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("IncludeInactive", sql.Bit, filters.includeInactive ? 1 : 0)
    .query(`
      SELECT
        m.MedicineId,
        m.CategoryId,
        c.CategoryName,
        m.MedicineName,
        m.Unit,
        m.Price,
        m.StockQuantity,
        m.MinStockQuantity,
        m.IsActive,
        m.CreatedAt,
        m.UpdatedAt
      FROM Medicines m
      LEFT JOIN MedicineCategories c ON m.CategoryId = c.CategoryId
      WHERE m.IsDeleted = 0
        AND (@IncludeInactive = 1 OR m.IsActive = 1)
      ORDER BY m.MedicineName ASC
    `);

  return result.recordset;
}

export async function getCategories() {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT CategoryId, CategoryName, Description
    FROM MedicineCategories
    ORDER BY CategoryName
  `);

  return result.recordset;
}

export async function createMedicine(input: CreateMedicineInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("MedicineName", sql.NVarChar(150), input.medicineName)
    .input("CategoryId", sql.Int, input.categoryId)
    .input("Unit", sql.NVarChar(30), input.unit)
    .input("Price", sql.Decimal(18, 2), input.price)
    .input("StockQuantity", sql.Int, input.stockQuantity)
    .input("MinStockQuantity", sql.Int, input.minStockQuantity)
    .input("IsActive", sql.Bit, input.isActive)
    .input("CreatedBy", sql.Int, null)
    .execute("dbo.sp_CreateMedicine");

  return result.recordset[0];
}

export async function updateMedicine(medicineId: number, input: UpdateMedicineInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("MedicineId", sql.Int, medicineId)
    .input("MedicineName", sql.NVarChar(150), input.medicineName)
    .input("CategoryId", sql.Int, input.categoryId)
    .input("Unit", sql.NVarChar(30), input.unit)
    .input("Price", sql.Decimal(18, 2), input.price)
    .input("MinStockQuantity", sql.Int, input.minStockQuantity)
    .input("IsActive", sql.Bit, input.isActive)
    .execute("dbo.sp_UpdateMedicine");

  return result.recordset[0];
}

export async function adjustStock(medicineId: number, input: StockAdjustmentInput) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("MedicineId", sql.Int, medicineId)
    .input("Type", sql.NVarChar(20), input.type)
    .input("Quantity", sql.Int, input.quantity)
    .input("Note", sql.NVarChar(500), input.note ?? null)
    .input("CreatedBy", sql.Int, input.createdBy ?? null)
    .execute("dbo.sp_AdjustMedicineStock");

  return result.recordset[0];
}

export async function updateMedicineStatus(medicineId: number, isActive: boolean) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("MedicineId", sql.Int, medicineId)
    .input("IsActive", sql.Bit, isActive)
    .execute("dbo.sp_SetMedicineStatus");

  return result.recordset[0] || null;
}
