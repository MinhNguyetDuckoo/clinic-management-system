import { Request, Response } from "express";
import * as patientService from "./patients.service";

export async function searchPatients(req: Request, res: Response) {
  try {
    const keyword = req.query.keyword as string | undefined;
    const data = await patientService.searchPatients(keyword);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tìm kiếm bệnh nhân."
    });
  }
}

export async function getPatientById(req: Request, res: Response) {
  try {
    const patientId = Number(req.params.id);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "PatientId không hợp lệ."
      });
    }

    const data = await patientService.getPatientById(patientId);

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message || "Không tìm thấy bệnh nhân."
    });
  }
}

export async function createPatient(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user?.userId;
    const result = await patientService.createPatient(req.body, currentUserId);

    return res.status(201).json({
      success: true,
      message: "Tạo bệnh nhân thành công.",
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Tạo bệnh nhân thất bại."
    });
  }
}

export async function updatePatient(req: Request, res: Response) {
  try {
    const patientId = Number(req.params.id);
    const currentUserId = (req as any).user?.userId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "PatientId không hợp lệ."
      });
    }

    const data = await patientService.updatePatient(patientId, req.body, currentUserId);

    return res.json({
      success: true,
      message: "Cập nhật bệnh nhân thành công.",
      data
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Cập nhật bệnh nhân thất bại."
    });
  }
}