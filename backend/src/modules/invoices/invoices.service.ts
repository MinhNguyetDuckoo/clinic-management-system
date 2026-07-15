import * as invoiceRepo from "./invoices.repository";

export async function getUnpaidInvoices() {
  return invoiceRepo.getUnpaidInvoices();
}

export async function getInvoices(filters: invoiceRepo.InvoiceListFilters) {
  const allowedStatuses = ["Unpaid", "Paid", "Cancelled", "All"];
  const status = filters.status || "All";

  if (!allowedStatuses.includes(status)) {
    throw new Error("Trạng thái hóa đơn không hợp lệ");
  }

  return invoiceRepo.getInvoices({
    ...filters,
    status
  });
}

export async function getReadyForInvoiceExaminations() {
  return invoiceRepo.getReadyForInvoiceExaminations();
}

export async function getInvoiceDetail(invoiceId: number) {
  const data = await invoiceRepo.getInvoiceDetail(invoiceId);
  if (!data.invoice) {
    throw new Error("Không tìm thấy hóa đơn");
  }
  return data;
}

export async function createInvoiceFromExamination(examinationId: number, currentUserId: number | null) {
  if (!examinationId) {
    throw new Error("Mã phiếu khám không hợp lệ");
  }
  return invoiceRepo.createInvoiceFromExamination(examinationId, currentUserId);
}

export async function payInvoice(
  invoiceId: number, 
  amount: number, 
  paymentMethod: string, 
  currentUserId: number | null,
  note?: string
) {
  if (!invoiceId) throw new Error("Mã hóa đơn không hợp lệ");
  if (!amount || amount <= 0) throw new Error("Số tiền thanh toán phải lớn hơn 0");
  if (!paymentMethod) throw new Error("Thiếu phương thức thanh toán");

  // Validate amount = TotalAmount
  const detail = await invoiceRepo.getInvoiceDetail(invoiceId);
  if (!detail.invoice) {
    throw new Error("Không tìm thấy hóa đơn");
  }
  if (detail.invoice.TotalAmount !== amount) {
    throw new Error(`Số tiền thanh toán không khớp tổng hóa đơn (${amount} != ${detail.invoice.TotalAmount})`);
  }

  return invoiceRepo.payInvoice(invoiceId, amount, paymentMethod, currentUserId, note || null);
}

export async function cancelInvoice(invoiceId: number, reason: string, currentUserId: number | null) {
  if (!invoiceId) throw new Error("Mã hóa đơn không hợp lệ");
  return invoiceRepo.cancelInvoice(invoiceId, currentUserId, reason || null);
}



export async function payInvoiceError(
  invoiceId: number,
  amount: number,
  paymentMethod: string,
  paidBy: number,
  note?: string
) {
  if (!invoiceId || !amount || !paymentMethod || !paidBy) {
    throw new Error("Thiếu thông tin bắt buộc.");
  }

  return await invoiceRepo.payInvoiceError({
    invoiceId,
    amount,
    paymentMethod,
    paidBy,
    note
  });
}

export async function createSampleInvoice() {
  return await invoiceRepo.createSampleInvoice();
}
