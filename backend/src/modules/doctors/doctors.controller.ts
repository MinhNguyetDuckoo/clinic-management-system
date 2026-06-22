import { Request, Response } from "express";
import * as doctorRepo from "./doctors.repository";

export async function getActiveDoctors(_req: Request, res: Response) {
  try {
    const data = await doctorRepo.getActiveDoctors();

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách bác sĩ."
    });
  }
}

export async function getDoctorSchedules(req: Request, res: Response) {
  try {
    const doctorId = Number(req.params.id);
    const date = req.query.date as string | undefined;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "DoctorId không hợp lệ."
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng truyền ngày cần xem lịch làm việc."
      });
    }

    const data = await doctorRepo.getDoctorSchedules(doctorId, date);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy lịch làm việc bác sĩ."
    });
  }
}

export async function getDoctorExaminations(req: Request, res: Response) {
  try {
    const doctorId = Number(req.params.id);
    const date = req.query.date as string | undefined;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "DoctorId không hợp lệ."
      });
    }

    const data = await doctorRepo.getDoctorExaminations(doctorId, date);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách phiếu khám."
    });
  }
}
