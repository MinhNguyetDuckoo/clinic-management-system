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
