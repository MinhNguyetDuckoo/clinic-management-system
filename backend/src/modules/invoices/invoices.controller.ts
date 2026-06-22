import { Request, Response } from "express";
import * as invoiceService from "./invoices.service";

export async function getUnpaidInvoices(req: Request, res: Response) {
  try {
    const data = await invoiceService.getUnpaidInvoices();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInvoices(req: Request, res: Response) {
  try {
    const { status, patientKeyword, dateFrom, dateTo } = req.query;
    const data = await invoiceService.getInvoices({
      status: typeof status === "string" ? status : "All",
      patientKeyword: typeof patientKeyword === "string" ? patientKeyword : null,
      dateFrom: typeof dateFrom === "string" ? dateFrom : null,
      dateTo: typeof dateTo === "string" ? dateTo : null
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getReadyForInvoiceExaminations(_req: Request, res: Response) {
  try {
    const data = await invoiceService.getReadyForInvoiceExaminations();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInvoiceDetail(req: Request, res: Response) {
  try {
    const invoiceId = Number(req.params.id);
    const data = await invoiceService.getInvoiceDetail(invoiceId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function createInvoiceFromExamination(req: Request, res: Response) {
  try {
    const { examinationId } = req.body;
    // Tạm lấy currentUserId = 5 nếu chưa có auth hoàn chỉnh để test
    const currentUserId = (req as any).user?.userId || 5; 
    const invoiceId = await invoiceService.createInvoiceFromExamination(Number(examinationId), currentUserId);
    res.status(201).json({ success: true, data: { invoiceId }, message: "Tạo hóa đơn thành công" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function payInvoice(req: Request, res: Response) {
  try {
    const invoiceId = Number(req.params.id);
    const { amount, paymentMethod, note } = req.body;
    const currentUserId = (req as any).user?.userId || 5;
    
    const paymentId = await invoiceService.payInvoice(
      invoiceId, 
      Number(amount), 
      paymentMethod, 
      currentUserId, 
      note
    );
    res.json({ success: true, data: { paymentId }, message: "Thanh toán thành công" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function cancelInvoice(req: Request, res: Response) {
  try {
    const invoiceId = Number(req.params.id);
    const { reason } = req.body;
    const currentUserId = (req as any).user?.userId || 5;
    
    const result = await invoiceService.cancelInvoice(invoiceId, reason, currentUserId);
    res.json({ success: true, data: result, message: "Hủy hóa đơn thành công" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
