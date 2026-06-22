import { Request, Response } from "express";
import * as examinationService from "./examinations.service";

export async function getExaminationDetail(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.id);
    const data = await examinationService.getExaminationDetail(examinationId);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Không tìm thấy phiếu khám."
    });
  }
}

export async function startExamination(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await examinationService.startExamination(examinationId, currentUserId);

    return res.json({
      success: true,
      message: "Bắt đầu khám thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Bắt đầu khám thất bại."
    });
  }
}

export async function saveDiagnosis(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await examinationService.saveDiagnosis(
      examinationId,
      req.body,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Lưu chẩn đoán thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Lưu chẩn đoán thất bại."
    });
  }
}

export async function createServiceOrder(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await examinationService.createServiceOrder(
      examinationId,
      req.body,
      currentUserId
    );

    return res.status(201).json({
      success: true,
      message: "Tạo chỉ định dịch vụ thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Tạo chỉ định dịch vụ thất bại."
    });
  }
}

export async function completeServiceOrder(req: Request, res: Response) {
  try {
    const serviceOrderId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await examinationService.completeServiceOrder(
      serviceOrderId,
      req.body,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Hoàn tất dịch vụ thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Hoàn tất dịch vụ thất bại."
    });
  }
}

export async function finishExamination(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await examinationService.finishExamination(
      examinationId,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Kết thúc khám thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Kết thúc khám thất bại."
    });
  }
}