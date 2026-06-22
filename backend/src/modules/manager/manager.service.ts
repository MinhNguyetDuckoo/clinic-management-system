import * as managerRepo from "./manager.repository";

export async function getDashboardSummary() {
  return managerRepo.getDashboardSummary();
}

export async function getRevenueByDay() {
  return managerRepo.getRevenueByDay();
}

export async function getMedicineStockStatus() {
  return managerRepo.getMedicineStockStatus();
}
