import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

type Prescription = {
  PrescriptionId: number;
  ExaminationId: number;
  DoctorName: string;
  PatientName: string;
  Status: string;
  CreatedAt: string;
};

type PrescriptionDetail = {
  PrescriptionDetailId: number;
  MedicineId: number;
  MedicineName: string;
  Unit: string;
  Quantity: number;
  Dosage: string;
  UsageInstruction: string;
  Price: number;
  StockQuantity: number;
  IsEnoughStock: boolean;
};

export default function PharmacistPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState<PrescriptionDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dispensing, setDispensing] = useState(false);

  async function loadPendingPrescriptions() {
    try {
      setLoading(true);
      // Route matches what was specified in the plan
      const response = await axiosClient.get("/prescriptions/pending");
      if (response.data.success) {
        setPrescriptions(response.data.data || []);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lấy danh sách đơn thuốc chờ cấp");
    } finally {
      setLoading(false);
    }
  }

  async function loadPrescriptionDetails(prescription: Prescription) {
    setSelectedPrescription(prescription);
    try {
      setDetailsLoading(true);
      const response = await axiosClient.get(`/prescriptions/${prescription.PrescriptionId}`);
      if (response.data.success) {
        setPrescriptionDetails(response.data.data.medicines || []);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lấy chi tiết đơn thuốc");
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetailsModal() {
    setSelectedPrescription(null);
    setPrescriptionDetails([]);
  }

  async function handleDispense() {
    if (!selectedPrescription) return;

    // Check if there's any medicine out of stock
    const outOfStock = prescriptionDetails.find(d => !d.IsEnoughStock);
    if (outOfStock) {
      alert(`Thuốc "${outOfStock.MedicineName}" không đủ tồn kho (Yêu cầu: ${outOfStock.Quantity}, Tồn: ${outOfStock.StockQuantity})`);
      return;
    }

    try {
      setDispensing(true);
      const response = await axiosClient.post(`/prescriptions/${selectedPrescription.PrescriptionId}/dispense`);
      
      if (response.data.success) {
        alert("Cấp thuốc thành công");
        closeDetailsModal();
        await loadPendingPrescriptions();
      } else {
        alert(response.data.message || "Không thể cấp thuốc");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi cấp thuốc: Không đủ tồn kho hoặc thuốc ngưng hoạt động");
    } finally {
      setDispensing(false);
    }
  }

  useEffect(() => {
    loadPendingPrescriptions();
  }, []);

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("vi-VN");
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Đơn thuốc chờ cấp phát</h1>
        <p className="text-sm text-gray-500">
          Danh sách các đơn thuốc bác sĩ đã kê, chờ dược sĩ xuất thuốc
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Danh sách đơn thuốc</h2>
            <p className="text-sm text-gray-500">Tổng cộng {prescriptions.length} đơn</p>
          </div>
          <button 
            onClick={loadPendingPrescriptions}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 rounded-lg"
          >
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-5 py-3">Mã đơn</th>
                <th className="text-left px-5 py-3">Mã PK</th>
                <th className="text-left px-5 py-3">Bệnh nhân</th>
                <th className="text-left px-5 py-3">Bác sĩ</th>
                <th className="text-left px-5 py-3">Ngày kê</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-gray-500">
                    Không có đơn thuốc nào đang chờ cấp phát
                  </td>
                </tr>
              ) : (
                prescriptions.map((item) => (
                  <tr key={item.PrescriptionId} className="border-t">
                    <td className="px-5 py-4 font-medium">#{item.PrescriptionId}</td>
                    <td className="px-5 py-4">#{item.ExaminationId}</td>
                    <td className="px-5 py-4 font-medium">{item.PatientName}</td>
                    <td className="px-5 py-4">{item.DoctorName}</td>
                    <td className="px-5 py-4">{formatDateTime(item.CreatedAt)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700 font-medium">
                        {item.Status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => loadPrescriptionDetails(item)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Chi tiết đơn thuốc #{selectedPrescription.PrescriptionId}</h2>
              <p className="text-sm text-gray-500">
                Bệnh nhân: <span className="font-medium text-gray-900">{selectedPrescription.PatientName}</span> - 
                Bác sĩ: <span className="font-medium text-gray-900">{selectedPrescription.DoctorName}</span>
              </p>
            </div>

            <div className="px-6 py-5 flex-1 overflow-y-auto">
              {detailsLoading ? (
                <div className="py-10 text-center text-gray-500">Đang tải chi tiết...</div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3">Tên thuốc</th>
                        <th className="text-left px-4 py-3">ĐVT</th>
                        <th className="text-center px-4 py-3">SL kê</th>
                        <th className="text-left px-4 py-3">Cách dùng</th>
                        <th className="text-center px-4 py-3">Tồn kho</th>
                        <th className="text-center px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptionDetails.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center px-4 py-6 text-gray-500">
                            Đơn thuốc trống
                          </td>
                        </tr>
                      ) : (
                        prescriptionDetails.map((detail) => (
                          <tr key={detail.PrescriptionDetailId} className="border-t">
                            <td className="px-4 py-3 font-medium">{detail.MedicineName}</td>
                            <td className="px-4 py-3">{detail.Unit}</td>
                            <td className="px-4 py-3 text-center font-medium">{detail.Quantity}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">
                              {detail.Dosage}
                              {detail.UsageInstruction && (
                                <div className="mt-1">{detail.UsageInstruction}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">{detail.StockQuantity}</td>
                            <td className="px-4 py-3 text-center">
                              {detail.IsEnoughStock ? (
                                <span className="text-green-600 font-medium">Đủ thuốc</span>
                              ) : (
                                <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">Thiếu thuốc</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeDetailsModal}
                disabled={dispensing}
                className="px-5 py-2 rounded-xl border bg-white text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                onClick={handleDispense}
                disabled={dispensing || detailsLoading || prescriptionDetails.length === 0}
                className="px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50 flex items-center"
              >
                {dispensing ? "Đang xử lý..." : "Cấp thuốc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
