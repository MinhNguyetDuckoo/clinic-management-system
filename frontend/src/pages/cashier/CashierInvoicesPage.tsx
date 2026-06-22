import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

type InvoiceStatusFilter = "Unpaid" | "Paid" | "Cancelled" | "All";

type UnpaidInvoice = {
  InvoiceId: number;
  PatientId: number;
  PatientCode: string;
  PatientName: string;
  PatientPhone: string;
  ExaminationId: number;
  TotalAmount: number;
  Status: "Unpaid" | "Paid" | "Cancelled";
  CreatedAt: string;
  PaidAt?: string | null;
  PaymentMethod?: string | null;
  PaidBy?: number | null;
  PaidByName?: string | null;
};

type InvoiceDetailItem = {
  InvoiceDetailId: number;
  ItemType: string;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  Amount: number;
};

type ReadyExamination = {
  PrescriptionId: number;
  ExaminationId: number;
  PrescriptionStatus: string;
  PrescriptionCreatedAt: string;
  DispensedAt?: string | null;
  PatientId: number;
  PatientCode: string;
  PatientName: string;
  PatientPhone?: string | null;
  DoctorId: number;
  DoctorName: string;
  TotalMedicineItems: number;
  MedicineAmount: number;
};

export default function CashierInvoicesPage() {
  const [invoices, setInvoices] = useState<UnpaidInvoice[]>([]);
  const [readyExaminations, setReadyExaminations] = useState<ReadyExamination[]>([]);
  const [loading, setLoading] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  const [examIdInput, setExamIdInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [creatingExamId, setCreatingExamId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("Unpaid");
  const [patientKeyword, setPatientKeyword] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState<UnpaidInvoice | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetailItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payNote, setPayNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const [cancelReason, setCancelReason] = useState("");

  async function loadInvoices() {
    try {
      setLoading(true);
      const response = await axiosClient.get("/invoices", {
        params: {
          status: statusFilter,
          patientKeyword: patientKeyword.trim() || undefined
        }
      });
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lấy danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  }

  async function loadReadyExaminations() {
    try {
      setReadyLoading(true);
      const response = await axiosClient.get("/invoices/ready-examinations");
      if (response.data.success) {
        setReadyExaminations(response.data.data || []);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Loi lay danh sach don thuoc da cap");
    } finally {
      setReadyLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  useEffect(() => {
    loadReadyExaminations();
  }, []);

  async function createInvoiceFromExamination(examinationId: number) {
    try {
      setCreating(true);
      setCreatingExamId(examinationId);
      const response = await axiosClient.post("/invoices/from-examination", {
        examinationId
      });
      if (response.data.success) {
        alert("Tao hoa don thanh cong");
        setExamIdInput("");
        setStatusFilter("Unpaid");
        await Promise.all([loadInvoices(), loadReadyExaminations()]);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Loi tao hoa don");
    } finally {
      setCreating(false);
      setCreatingExamId(null);
    }
  }

  async function handleCreateInvoice() {
    if (!examIdInput) {
      alert("Vui lòng nhập mã phiếu khám");
      return;
    }
    try {
      setCreating(true);
      const response = await axiosClient.post("/invoices/from-examination", {
        examinationId: Number(examIdInput)
      });
      if (response.data.success) {
        alert("Tạo hóa đơn thành công");
        setExamIdInput("");
        setStatusFilter("Unpaid");
        await Promise.all([loadInvoices(), loadReadyExaminations()]);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi tạo hóa đơn");
    } finally {
      setCreating(false);
    }
  }

  async function openDetailsModal(invoice: UnpaidInvoice) {
    setSelectedInvoice(invoice);
    setPayAmount(invoice.TotalAmount);
    setPaymentMethod("Cash");
    setPayNote("");
    setCancelReason("");
    
    try {
      setDetailsLoading(true);
      const response = await axiosClient.get(`/invoices/${invoice.InvoiceId}`);
      if (response.data.success) {
        setInvoiceDetails(response.data.data.details || []);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lấy chi tiết hóa đơn");
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetailsModal() {
    setSelectedInvoice(null);
    setInvoiceDetails([]);
  }

  async function handlePayInvoice() {
    if (!selectedInvoice) return;
    if (payAmount <= 0) {
      alert("Số tiền thanh toán phải lớn hơn 0");
      return;
    }
    if (payAmount !== selectedInvoice.TotalAmount) {
      alert(`Số tiền thanh toán phải bằng tổng hóa đơn (${selectedInvoice.TotalAmount.toLocaleString()} VNĐ)`);
      return;
    }

    try {
      setProcessing(true);
      const response = await axiosClient.post(`/invoices/${selectedInvoice.InvoiceId}/pay`, {
        amount: payAmount,
        paymentMethod,
        note: payNote
      });
      if (response.data.success) {
        alert("Thanh toán thành công");
        closeDetailsModal();
        loadInvoices();
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi thanh toán");
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancelInvoice() {
    if (!selectedInvoice) return;
    if (!cancelReason) {
      alert("Vui lòng nhập lý do hủy");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn hủy hóa đơn này?")) return;

    try {
      setProcessing(true);
      const response = await axiosClient.post(`/invoices/${selectedInvoice.InvoiceId}/cancel`, {
        reason: cancelReason
      });
      if (response.data.success) {
        alert("Hủy hóa đơn thành công");
        closeDetailsModal();
        loadInvoices();
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi hủy hóa đơn");
    } finally {
      setProcessing(false);
    }
  }

  function formatDateTime(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  }

  function getStatusLabel(status: string) {
    if (status === "Paid") return "Đã thanh toán";
    if (status === "Cancelled") return "Đã hủy";
    return "Chờ thanh toán";
  }

  function getStatusClass(status: string) {
    if (status === "Paid") return "bg-green-50 text-green-700";
    if (status === "Cancelled") return "bg-red-50 text-red-700";
    return "bg-orange-50 text-orange-700";
  }

  const statusTabs: Array<{ value: InvoiceStatusFilter; label: string }> = [
    { value: "Unpaid", label: "Chờ thanh toán" },
    { value: "Paid", label: "Đã thanh toán" },
    { value: "Cancelled", label: "Đã hủy" },
    { value: "All", label: "Tất cả" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hóa đơn chờ thanh toán</h1>
        <p className="text-sm text-gray-500">
          Quản lý và thanh toán các hóa đơn khám chữa bệnh
        </p>
      </div>

      {/* Tạo hóa đơn mới */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Don thuoc da cap cho lap hoa don</h2>
            <p className="text-sm text-gray-500">
              Bam tao hoa don truc tiep, khong can nho ma phieu kham
            </p>
          </div>
          <button
            onClick={loadReadyExaminations}
            disabled={readyLoading}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 rounded-lg disabled:opacity-50"
          >
            {readyLoading ? "Dang tai..." : "Lam moi"}
          </button>
        </div>

        {readyLoading ? (
          <div className="p-5 text-sm text-gray-500">Dang tai don thuoc da cap...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-5 py-3">Ma don</th>
                <th className="text-left px-5 py-3">Ma PK</th>
                <th className="text-left px-5 py-3">Benh nhan</th>
                <th className="text-left px-5 py-3">Bac si</th>
                <th className="text-left px-5 py-3">Ngay cap thuoc</th>
                <th className="text-right px-5 py-3">Tien thuoc</th>
                <th className="text-right px-5 py-3">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {readyExaminations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-gray-500">
                    Khong co don thuoc da cap nao dang cho lap hoa don
                  </td>
                </tr>
              ) : (
                readyExaminations.map((item) => (
                  <tr key={item.PrescriptionId} className="border-t">
                    <td className="px-5 py-4 font-medium">#{item.PrescriptionId}</td>
                    <td className="px-5 py-4">#{item.ExaminationId}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{item.PatientName}</div>
                      <div className="text-xs text-gray-500">
                        {item.PatientCode} - {item.PatientPhone || "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">{item.DoctorName}</td>
                    <td className="px-5 py-4">
                      {formatDateTime(item.DispensedAt || item.PrescriptionCreatedAt)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-green-700">
                      {Number(item.MedicineAmount || 0).toLocaleString()} VND
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => createInvoiceFromExamination(item.ExaminationId)}
                        disabled={creating}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
                      >
                        {creatingExamId === item.ExaminationId ? "Dang tao..." : "Tao hoa don"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mã phiếu khám (ExaminationId)</label>
          <input
            type="number"
            value={examIdInput}
            onChange={(e) => setExamIdInput(e.target.value)}
            placeholder="VD: 1006"
            className="w-64 px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCreateInvoice}
          disabled={creating}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Đang tạo..." : "Tạo hóa đơn"}
        </button>
      </div>

      {/* Danh sách hóa đơn */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Danh sách hóa đơn</h2>
            <p className="text-sm text-gray-500">Tổng cộng {invoices.length} hóa đơn</p>
          </div>
          <button 
            onClick={loadInvoices}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 rounded-lg"
          >
            Làm mới
          </button>
        </div>

        <div className="px-5 py-4 border-b space-y-3">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  statusFilter === tab.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={patientKeyword}
              onChange={(e) => setPatientKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadInvoices();
              }}
              placeholder="Tìm theo tên, SĐT, mã BN hoặc mã HĐ..."
              className="w-full max-w-md px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadInvoices}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-5 py-3">Mã HĐ</th>
                <th className="text-left px-5 py-3">Mã PK</th>
                <th className="text-left px-5 py-3">Bệnh nhân</th>
                <th className="text-left px-5 py-3">Ngày tạo</th>
                <th className="text-right px-5 py-3">Tổng tiền</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-left px-5 py-3">PT thanh toán</th>
                <th className="text-left px-5 py-3">Ngày thanh toán</th>
                <th className="text-right px-5 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-6 text-center text-gray-500">
                    Không có hóa đơn nào đang chờ
                  </td>
                </tr>
              ) : (
                invoices.map((item) => (
                  <tr key={item.InvoiceId} className="border-t">
                    <td className="px-5 py-4 font-medium">#{item.InvoiceId}</td>
                    <td className="px-5 py-4">#{item.ExaminationId}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{item.PatientName}</div>
                      <div className="text-xs text-gray-500">{item.PatientPhone}</div>
                    </td>
                    <td className="px-5 py-4">{formatDateTime(item.CreatedAt)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-blue-700">
                      {item.TotalAmount?.toLocaleString()} VNĐ
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(item.Status)}`}>
                        {getStatusLabel(item.Status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">{item.PaymentMethod || "-"}</td>
                    <td className="px-5 py-4">{item.PaidAt ? formatDateTime(item.PaidAt) : "-"}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetailsModal(item)}
                        className="rounded-xl bg-blue-100 px-4 py-2 text-blue-700 hover:bg-blue-200 font-medium"
                      >
                        Xem chi tiết
                      </button>
                      {item.Status === "Unpaid" && (
                        <>
                          <button
                            onClick={() => openDetailsModal(item)}
                            className="ml-2 rounded-xl bg-green-100 px-4 py-2 text-green-700 hover:bg-green-200 font-medium"
                          >
                            Thanh toán
                          </button>
                          <button
                            onClick={() => openDetailsModal(item)}
                            className="ml-2 rounded-xl bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 font-medium"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Chi tiết & Thanh toán */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-xl max-h-[95vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">Chi tiết hóa đơn #{selectedInvoice.InvoiceId}</h2>
                <p className="text-sm text-gray-500">
                  Bệnh nhân: <span className="font-medium text-gray-900">{selectedInvoice.PatientName}</span> - SĐT: {selectedInvoice.PatientPhone}
                </p>
                <div className="mt-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(selectedInvoice.Status)}`}>
                    {getStatusLabel(selectedInvoice.Status)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Tổng thanh toán</p>
                <p className="text-xl font-bold text-blue-700">{selectedInvoice.TotalAmount?.toLocaleString()} VNĐ</p>
              </div>
            </div>

            <div className="px-6 py-5 flex-1 overflow-y-auto">
              {selectedInvoice.Status === "Paid" && (
                <div className="mb-5 rounded-xl border bg-green-50 p-4 text-sm text-green-900">
                  <div className="font-medium">Thông tin thanh toán</div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>Phương thức: <span className="font-medium">{selectedInvoice.PaymentMethod || "-"}</span></div>
                    <div>Thời gian: <span className="font-medium">{selectedInvoice.PaidAt ? formatDateTime(selectedInvoice.PaidAt) : "-"}</span></div>
                    <div>Người thu: <span className="font-medium">{selectedInvoice.PaidByName || selectedInvoice.PaidBy || "-"}</span></div>
                  </div>
                </div>
              )}

              <h3 className="font-medium mb-3">Chi tiết dịch vụ & thuốc</h3>
              {detailsLoading ? (
                <div className="py-10 text-center text-gray-500">Đang tải chi tiết...</div>
              ) : (
                <div className="border rounded-xl overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3">Loại</th>
                        <th className="text-left px-4 py-3">Mô tả</th>
                        <th className="text-center px-4 py-3">SL</th>
                        <th className="text-right px-4 py-3">Đơn giá</th>
                        <th className="text-right px-4 py-3">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetails.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center px-4 py-6 text-gray-500">
                            Không có chi tiết
                          </td>
                        </tr>
                      ) : (
                        invoiceDetails.map((detail) => (
                          <tr key={detail.InvoiceDetailId} className="border-t">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                detail.ItemType === 'Consultation' ? 'bg-purple-50 text-purple-700' :
                                detail.ItemType === 'Service' ? 'bg-sky-50 text-sky-700' :
                                'bg-green-50 text-green-700'
                              }`}>
                                {detail.ItemType}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">{detail.Description}</td>
                            <td className="px-4 py-3 text-center">{detail.Quantity}</td>
                            <td className="px-4 py-3 text-right">{detail.UnitPrice?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-medium">{detail.Amount?.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Form Thanh toán & Hủy */}
              {selectedInvoice.Status === "Unpaid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Khu vực thanh toán */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                  <h3 className="font-medium text-blue-900">Thông tin thanh toán</h3>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Phương thức *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="Cash">Tiền mặt (Cash)</option>
                      <option value="Card">Thẻ (Card)</option>
                      <option value="BankTransfer">Chuyển khoản (BankTransfer)</option>
                      <option value="EWallet">Ví điện tử (EWallet)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Số tiền (VNĐ) *</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Ghi chú thanh toán..."
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                  </div>

                  <button
                    onClick={handlePayInvoice}
                    disabled={processing || detailsLoading}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Xác nhận Thanh toán
                  </button>
                </div>

                {/* Khu vực hủy hóa đơn */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-4">
                  <h3 className="font-medium text-red-900">Hủy hóa đơn</h3>
                  <p className="text-xs text-red-700">
                    Sử dụng khi bệnh nhân không thanh toán hoặc có sai sót cần tạo lại.
                  </p>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Lý do hủy *</label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Nhập lý do..."
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleCancelInvoice}
                    disabled={processing || detailsLoading}
                    className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Hủy hóa đơn này
                  </button>
                </div>
              </div>
              ) : (
                <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                  Hóa đơn {getStatusLabel(selectedInvoice.Status).toLowerCase()} chỉ được xem chi tiết, không thể thanh toán hoặc hủy lại.
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeDetailsModal}
                disabled={processing}
                className="px-5 py-2 rounded-xl border bg-white text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
