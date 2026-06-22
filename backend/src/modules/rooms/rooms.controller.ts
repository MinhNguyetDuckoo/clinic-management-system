import { Request, Response } from "express";
import * as roomRepo from "./rooms.repository";

export async function getActiveRooms(_req: Request, res: Response) {
  try {
    const data = await roomRepo.getActiveRooms();

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách phòng."
    });
  }
}
