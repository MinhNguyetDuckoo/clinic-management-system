import { Request, Response } from "express";
import * as appointmentService from "./appointments.service";

export async function getAppointmentsByDate(req: Request, res: Response) {
  try {
    const date = req.query.date as string | undefined;
    const data = await appointmentService.getAppointmentsByDate(date);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách lịch hẹn."
    });
  }
}

export async function createAppointment(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user?.userId;
    const result = await appointmentService.createAppointment(req.body, currentUserId);

    return res.status(201).json({
      success: true,
      message: "Tạo lịch hẹn thành công.",
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Tạo lịch hẹn thất bại."
    });
  }
}

export async function checkInPatient(req: Request, res: Response) {
  try {
    const appointmentId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const result = await appointmentService.checkInPatient(appointmentId, currentUserId);

    return res.json({
      success: true,
      message: "Check-in bệnh nhân thành công.",
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Check-in thất bại."
    });
  }
}

export async function cancelAppointment(req: Request, res: Response) {
  try {
    const appointmentId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await appointmentService.cancelAppointment(
      appointmentId,
      req.body,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Hủy lịch hẹn thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Hủy lịch hẹn thất bại."
    });
  }
}