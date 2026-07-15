import { Request, Response } from "express";
import * as reportService from "./reports.service";

export async function getRevenueByDay(_req: Request, res: Response) {
  try {
    const data = await reportService.getRevenueByDay();

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy báo cáo doanh thu."
    });
  }
}

export async function getMedicineStockStatus(_req: Request, res: Response) {
  try {
    const data = await reportService.getMedicineStockStatus();

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy báo cáo tồn kho thuốc."
    });
  }
}

export async function getRevenueByDayDirty(_req: Request, res: Response) {
  try {
    const data = await reportService.getRevenueByDayDirty();
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy báo cáo doanh thu."
    });
  }
}