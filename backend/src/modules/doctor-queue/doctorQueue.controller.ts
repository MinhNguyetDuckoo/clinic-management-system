import { Request, Response } from "express";
import {
  getDoctorTodayQueueService,
  startExaminationService,
  saveDiagnosisService,
  finishExaminationService,
} from "./doctorQueue.service";

export async function getDoctorTodayQueue(req: Request, res: Response) {
  try {
    const doctorId = Number(req.params.doctorId);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "DoctorId không hợp lệ",
      });
    }

    const data = await getDoctorTodayQueueService(doctorId);

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi lấy hàng chờ khám",
    });
  }
}

export async function startExamination(req: Request, res: Response) {
  try {
    const { examinationId, appointmentId } = req.body;
    const currentUserId = (req as any).user?.userId;

    if (!examinationId && !appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ExaminationId hoặc AppointmentId",
      });
    }

    const data = await startExaminationService(
      examinationId ? Number(examinationId) : null,
      appointmentId ? Number(appointmentId) : null,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Bắt đầu khám thành công",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi bắt đầu khám",
    });
  }
}

export async function saveDiagnosis(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.examinationId);
    const { symptoms, diagnosis, treatment, notes } = req.body;
    const currentUserId = (req as any).user?.userId;

    if (!examinationId) {
      return res.status(400).json({
        success: false,
        message: "ExaminationId không hợp lệ",
      });
    }

    await saveDiagnosisService(examinationId, {
      symptoms,
      diagnosis,
      treatment,
      notes,
      doctorUserId: currentUserId,
    });

    return res.json({
      success: true,
      message: "Lưu chẩn đoán thành công",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi lưu chẩn đoán",
    });
  }
}

export async function finishExamination(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.examinationId);
    const currentUserId = (req as any).user?.userId;

    if (!examinationId) {
      return res.status(400).json({
        success: false,
        message: "ExaminationId không hợp lệ",
      });
    }

    await finishExaminationService(examinationId, currentUserId);

    return res.json({
      success: true,
      message: "Hoàn tất khám thành công",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hoàn tất khám",
    });
  }
}
