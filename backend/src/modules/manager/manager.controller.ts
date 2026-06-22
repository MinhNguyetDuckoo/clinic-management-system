import { Request, Response } from "express";
import * as managerService from "./manager.service";

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    const data = await managerService.getDashboardSummary();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRevenueByDay(req: Request, res: Response) {
  try {
    const data = await managerService.getRevenueByDay();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMedicineStockStatus(req: Request, res: Response) {
  try {
    const data = await managerService.getMedicineStockStatus();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
