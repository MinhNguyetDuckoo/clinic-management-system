import * as reportRepo from "./reports.repository";

export async function getRevenueByDay() {
  return reportRepo.getRevenueByDay();
}

export async function getMedicineStockStatus() {
  return await reportRepo.getMedicineStockStatus();
}

export async function getRevenueByDayDirty() {
  return await reportRepo.getRevenueByDayDirty();
}