import { NextFunction, Request, Response } from "express";
import * as medicineService from "./medicines.service";

export async function getMedicines(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await medicineService.getMedicines(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await medicineService.getCategories();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createMedicine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await medicineService.createMedicine(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateMedicine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await medicineService.updateMedicine(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await medicineService.adjustStock(
      Number(req.params.id),
      req.body,
      (req as any).user?.userId
    );
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateMedicineStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await medicineService.updateMedicineStatus(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateMedicineStatus(req: Request, res: Response) {
  try {
    const medicineId = Number(req.params.id);
    const { isActive } = req.body;
    const data = await medicineService.updateMedicineStatus(medicineId, isActive);
    res.json({ success: true, data, message: "Cập nhật trạng thái thành công" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function swapMedicineStock(req: Request, res: Response) {
  try {
    const { medAId, medBId } = req.body;
    const data = await medicineService.swapMedicineStock(Number(medAId), Number(medBId));
    res.json({ success: true, data, message: "Hoán đổi thành công (Không bị deadlock)" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Lỗi khi hoán đổi (Deadlock)" });
  }
}

export async function swapMedicineStockFixed(req: Request, res: Response) {
  try {
    const { medAId, medBId } = req.body;
    const data = await medicineService.swapMedicineStockFixed(Number(medAId), Number(medBId));
    res.json({ success: true, data, message: "Hoán đổi thành công (Đã Fixed Deadlock)" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Lỗi khi hoán đổi" });
  }
}
