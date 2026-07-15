import { AppError } from "../../utils/AppError";
import * as medicineRepo from "./medicines.repository";

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${field} la bat buoc.`);
  }
  return value.trim();
}

function positiveInt(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${field} phai la so nguyen duong.`);
  }
  return parsed;
}

function nonNegativeInt(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(`${field} khong duoc am.`);
  }
  return parsed;
}

function nonNegativeNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${field} khong duoc am.`);
  }
  return parsed;
}

function booleanValue(value: unknown, defaultValue = true) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AppError("isActive khong hop le.");
}

export async function getMedicines(query: any) {
  return medicineRepo.getMedicines({
    includeInactive: booleanValue(query.includeInactive, false)
  });
}

export async function getActiveMedicines() {
  return medicineRepo.getMedicines({ includeInactive: false });
}

export async function getCategories() {
  return medicineRepo.getCategories();
}

export async function createMedicine(body: any) {
  return medicineRepo.createMedicine({
    medicineName: requiredString(body.medicineName, "medicineName"),
    categoryId: positiveInt(body.categoryId, "categoryId"),
    unit: requiredString(body.unit, "unit"),
    price: nonNegativeNumber(body.price, "price"),
    stockQuantity: nonNegativeInt(body.stockQuantity, "stockQuantity"),
    minStockQuantity: nonNegativeInt(body.minStockQuantity, "minStockQuantity"),
    isActive: booleanValue(body.isActive, true)
  });
}

export async function updateMedicine(medicineId: number, body: any) {
  const medicine = await medicineRepo.updateMedicine(positiveInt(medicineId, "medicineId"), {
    medicineName: requiredString(body.medicineName, "medicineName"),
    categoryId: positiveInt(body.categoryId, "categoryId"),
    unit: requiredString(body.unit, "unit"),
    price: nonNegativeNumber(body.price, "price"),
    minStockQuantity: nonNegativeInt(body.minStockQuantity, "minStockQuantity"),
    isActive: booleanValue(body.isActive, true)
  });

  if (!medicine) throw new AppError("Thuoc khong ton tai.", 404);
  return medicine;
}

export async function adjustStock(medicineId: number, body: any, fallbackUserId?: number) {
  const type = requiredString(body.type, "type").toUpperCase();

  if (type !== "IN" && type !== "ADJUST") {
    throw new AppError("Manager chi duoc nhap kho hoac dieu chinh kho.");
  }

  return medicineRepo.adjustStock(positiveInt(medicineId, "medicineId"), {
    type,
    quantity: positiveInt(body.quantity, "quantity"),
    note: typeof body.note === "string" ? body.note.trim() : null,
    createdBy: body.createdBy ? positiveInt(body.createdBy, "createdBy") : fallbackUserId ?? null
  });
}

export async function updateMedicineStatus(medicineId: number, body: any) {
  const medicine = await medicineRepo.updateMedicineStatus(
    positiveInt(medicineId, "medicineId"),
    booleanValue(body.isActive, true)
  );

  if (!medicine) throw new AppError("Thuoc khong ton tai.", 404);
  return medicine;
}

export async function updateMedicineStatusRaw(medicineId: number, isActive: boolean) {
  return await medicineRepo.updateMedicineStatus(medicineId, isActive);
}

export async function swapMedicineStock(medAId: number, medBId: number) {
  if (!medAId || !medBId) {
    throw new Error("Thiếu ID thuốc.");
  }
  return await medicineRepo.swapMedicineStock(medAId, medBId);
}

export async function swapMedicineStockFixed(medAId: number, medBId: number) {
  if (!medAId || !medBId) {
    throw new Error("Thiếu ID thuốc.");
  }
  return await medicineRepo.swapMedicineStockFixed(medAId, medBId);
}
