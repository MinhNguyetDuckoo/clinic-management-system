import * as reportRepo from "./reports.repository";

export async function getRevenueByDay() {
  return reportRepo.getRevenueByDay();
}

export async function getMedicineStockStatus() {
  return reportRepo.getMedicineStockStatus();
}