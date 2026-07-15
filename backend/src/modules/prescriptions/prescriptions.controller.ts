import { Request, Response } from "express";
import * as prescriptionService from "./prescriptions.service";

export async function createPrescription(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user?.userId;
    const data = await prescriptionService.createPrescription(req.body, currentUserId);

    return res.status(201).json({
      success: true,
      message: "Tạo đơn thuốc thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Tạo đơn thuốc thất bại."
    });
  }
}

export async function addPrescriptionDetail(req: Request, res: Response) {
  try {
    const prescriptionId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await prescriptionService.addPrescriptionDetail(
      prescriptionId,
      req.body,
      currentUserId
    );

    return res.status(201).json({
      success: true,
      message: "Thêm thuốc vào đơn thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Thêm thuốc vào đơn thất bại."
    });
  }
}

export async function getPrescriptionDetail(req: Request, res: Response) {
  try {
    const prescriptionId = Number(req.params.id);
    const data = await prescriptionService.getPrescriptionDetail(prescriptionId);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Không tìm thấy đơn thuốc."
    });
  }
}

export async function getPendingPrescriptions(_req: Request, res: Response) {
  try {
    const data = await prescriptionService.getPendingPrescriptions();

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách đơn thuốc chờ cấp."
    });
  }
}

export async function dispenseMedicine(req: Request, res: Response) {
  try {
    const prescriptionId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await prescriptionService.dispenseMedicine(
      prescriptionId,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Cấp thuốc thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Cấp thuốc thất bại."
    });
  }
}

export async function deletePrescriptionDetail(req: Request, res: Response) {
  try {
    const prescriptionDetailId = Number(req.params.detailId);
    const currentUserId = (req as any).user?.userId;

    const data = await prescriptionService.deletePrescriptionDetail(
      prescriptionDetailId,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Xóa thuốc khỏi đơn thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Xóa thuốc khỏi đơn thất bại."
    });
  }
}

export async function getPrescriptionByExaminationId(req: Request, res: Response) {
  try {
    const examinationId = Number(req.params.examinationId);
    const data = await prescriptionService.getPrescriptionByExaminationId(examinationId);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Không thể lấy đơn thuốc theo phiếu khám."
    });
  }
}

export async function dispenseMedicineDelay(req: Request, res: Response) {
  try {
    const prescriptionId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await prescriptionService.dispenseMedicineDelay(
      prescriptionId,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Cấp thuốc thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Cấp thuốc thất bại."
    });
  }
}

export async function createSampleData(req: Request, res: Response) {
  try {
    const data = await prescriptionService.createSampleData();
    return res.json({ success: true, data, message: "Tạo dữ liệu mẫu thành công." });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function dispenseMedicineLostUpdate(req: Request, res: Response) {
  try {
    const prescriptionId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    const data = await prescriptionService.dispenseMedicineLostUpdate(
      prescriptionId,
      currentUserId
    );

    return res.json({
      success: true,
      message: "Cấp thuốc (Lost Update demo) thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Cấp thuốc thất bại."
    });
  }
}
