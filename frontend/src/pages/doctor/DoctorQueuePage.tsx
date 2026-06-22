import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getUser } from "../../utils/authStorage";

type QueueItem = {
  AppointmentId: number;
  ExaminationId?: number;
  Symptoms?: string | null;
  Diagnosis?: string | null;
  Conclusion?: string | null;
  DoctorId: number;
  PatientId: number;
  PatientName: string;
  AppointmentTime: string;
  Reason?: string;
  RoomName?: string;
  RoomCode?: string;
  Status: string;
  AppointmentStatus?: string;
  ExaminationStatus?: string;
};

const statusMap: Record<string, string> = {
  Waiting: "Đang chờ khám",
  CheckedIn: "Đã check-in",
  InProgress: "Đang khám",
  Completed: "Hoàn tất",
  Scheduled: "Đang chờ",
  Cancelled: "Đã hủy",
  NoShow: "Không đến",
};

function formatTime(value?: string | Date) {
  if (!value) return "-";

  const timeString = typeof value === "string" ? value : value.toISOString();
  const match = timeString.match(/(\d{2}:\d{2})/);

  if (match) {
    return match[1];
  }

  return timeString;
}

function normalizeStatus(value?: string) {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();

  if (normalized === "waiting") {
    return "Waiting";
  }

  if (normalized === "checkedin" || normalized === "checked-in") {
    return "CheckedIn";
  }

  if (normalized === "inprogress" || normalized === "in-progress") {
    return "InProgress";
  }

  if (normalized === "scheduled") {
    return "Scheduled";
  }

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  if (normalized === "noshow" || normalized === "no-show") {
    return "NoShow";
  }

  return value;
}

type DiagnosisFormData = {
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
};

type PrescriptionItemData = {
  prescriptionDetailId?: number;
  medicineId: number;
  medicineName: string;
  stockQuantity: number;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
};

function parseUsageInstruction(value?: string | null) {
  const result = {
    frequency: "",
    duration: "",
    instruction: "",
  };

  if (!value) return result;

  for (const part of value.split(".")) {
    const trimmed = part.trim();

    if (trimmed.startsWith("Tần suất:") || trimmed.startsWith("Táº§n suáº¥t:")) {
      result.frequency = trimmed.split(":").slice(1).join(":").trim();
    } else if (trimmed.startsWith("Thời gian:") || trimmed.startsWith("Thá»i gian:")) {
      result.duration = trimmed.split(":").slice(1).join(":").trim();
    } else if (trimmed.startsWith("HD:")) {
      result.instruction = trimmed.split(":").slice(1).join(":").trim();
    } else if (trimmed) {
      result.instruction = result.instruction
        ? `${result.instruction}. ${trimmed}`
        : trimmed;
    }
  }

  return result;
}

function parseConclusion(value?: string | null) {
  if (!value) {
    return {
      treatment: "",
      notes: "",
    };
  }

  const marker = " | ";
  const markerIndex = value.indexOf(marker);

  if (markerIndex === -1) {
    return {
      treatment: value,
      notes: "",
    };
  }

  return {
    treatment: value.slice(0, markerIndex),
    notes: value.slice(markerIndex + marker.length),
  };
}

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [pageError, setPageError] = useState("");
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState<QueueItem | null>(null);
  const [diagnosisForm, setDiagnosisForm] = useState<DiagnosisFormData>({
    symptoms: "",
    diagnosis: "",
    treatment: "",
    notes: "",
  });
  const [submittingDiagnosis, setSubmittingDiagnosis] = useState(false);
  
  // Prescription states
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemData[]>([]);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<number | null>(null);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState<Partial<PrescriptionItemData>>({});
  void loadMedicines;
  
  async function resolveCurrentDoctorId() {
    const user = getUser();

    if (!user?.userId) {
      setPageError("Không tìm thấy thông tin đăng nhập bác sĩ.");
      return null;
    }

    const response = await axiosClient.get("/doctors");
    const doctors = response.data.data || [];
    const currentDoctor = doctors.find(
      (doctor: { UserId?: number; userId?: number }) =>
        Number(doctor.UserId ?? doctor.userId) === Number(user.userId)
    );

    if (!currentDoctor?.DoctorId) {
      setPageError("Tài khoản hiện tại chưa được liên kết với hồ sơ bác sĩ.");
      return null;
    }

    const resolvedDoctorId = Number(currentDoctor.DoctorId);
    setDoctorId(resolvedDoctorId);
    return resolvedDoctorId;
  }

  async function loadQueue(targetDoctorId = doctorId) {
    try {
      setLoading(true);
      setPageError("");

      const resolvedDoctorId = targetDoctorId ?? (await resolveCurrentDoctorId());

      if (!resolvedDoctorId) {
        setQueue([]);
        return;
      }

      const response = await axiosClient.get(`/doctors/${resolvedDoctorId}/today-queue`);
      console.log("Doctor queue response:", response.data.data);
      
      const allData = response.data.data || [];
      const filteredQueue = allData.filter((item: QueueItem) => {
        const status = normalizeStatus(item.Status);
        return ["Waiting", "CheckedIn", "InProgress"].includes(status);
      });
      
      setQueue(filteredQueue);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lấy hàng chờ khám");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartExamination(item: QueueItem) {
    if (!doctorId) {
      alert("Không tìm thấy hồ sơ bác sĩ của tài khoản hiện tại.");
      return;
    }

    try {
      const response = await axiosClient.post("/examinations/start", {
        examinationId: item.ExaminationId,
        doctorId,
      });

      if (!response.data.success) {
        alert(response.data.message || "Không thể bắt đầu khám");
        return;
      }

      alert("Đã bắt đầu khám");
      await loadQueue();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi bắt đầu khám");
    }
  }

  async function handleFinishExamination(item: QueueItem) {
    if (!item.ExaminationId) {
      alert("ExaminationId không hợp lệ");
      return;
    }

    try {
      const response = await axiosClient.post(`/examinations/${item.ExaminationId}/finish`);

      if (!response.data.success) {
        alert(response.data.message || "Không thể hoàn tất khám");
        return;
      }

      alert("Đã hoàn tất khám");
      await loadQueue();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi hoàn tất khám");
    }
  }

  function openDiagnosisForm(item: QueueItem) {
    const conclusion = parseConclusion(item.Conclusion);

    setSelectedExamination(item);
    setDiagnosisForm({
      symptoms: item.Symptoms || "",
      diagnosis: item.Diagnosis || "",
      treatment: conclusion.treatment,
      notes: conclusion.notes,
    });
    setShowDiagnosisForm(true);
  }

  function closeDiagnosisForm() {
    setShowDiagnosisForm(false);
    setSelectedExamination(null);
    setDiagnosisForm({ symptoms: "", diagnosis: "", treatment: "", notes: "" });
  }

  async function handleSaveDiagnosis() {
    if (!selectedExamination?.ExaminationId) {
      alert("ExaminationId không hợp lệ");
      return;
    }

    if (!diagnosisForm.diagnosis.trim()) {
      alert("Vui lòng nhập chẩn đoán");
      return;
    }

    try {
      setSubmittingDiagnosis(true);
      const response = await axiosClient.post(
        `/examinations/${selectedExamination.ExaminationId}/diagnosis`,
        {
          symptoms: diagnosisForm.symptoms,
          diagnosis: diagnosisForm.diagnosis,
          treatment: diagnosisForm.treatment,
          notes: diagnosisForm.notes,
        }
      );

      if (!response.data.success) {
        alert(response.data.message || "Không thể lưu chẩn đoán");
        return;
      }

      alert("Đã lưu chẩn đoán");
      closeDiagnosisForm();
      await loadQueue();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lưu chẩn đoán");
    } finally {
      setSubmittingDiagnosis(false);
    }
  }

  async function loadMedicines() {
    try {
      const response = await axiosClient.get("/medicines");
      if (response.data.success) {
        setMedicines(response.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thuốc:", error);
    }
  }

  async function openPrescriptionForm(item: QueueItem) {
    setSelectedExamination(item);
    setPrescriptionItems([]);
    setSavedPrescriptionId(null);
    setCurrentMedicine({});
    setShowPrescriptionForm(true);

    let medicineList = medicines;

    if (medicineList.length === 0) {
      try {
        const response = await axiosClient.get("/medicines");
        medicineList = response.data.data || [];
        setMedicines(medicineList);
      } catch (error) {
        console.error("Lá»—i láº¥y danh sÃ¡ch thuá»‘c:", error);
      }
    }

    if (!item.ExaminationId) return;

    try {
      const response = await axiosClient.get(
        `/prescriptions/examination/${item.ExaminationId}`
      );
      const savedItems = response.data.data?.medicines || [];
      const existingPrescriptionId = response.data.data?.prescription?.PrescriptionId;

      setSavedPrescriptionId(
        existingPrescriptionId && savedItems.length > 0
          ? Number(existingPrescriptionId)
          : null
      );

      setPrescriptionItems(
        savedItems.map((saved: any) => {
          const usage = parseUsageInstruction(saved.UsageInstruction);
          const medicine = medicineList.find(
            (med: any) => Number(med.MedicineId) === Number(saved.MedicineId)
          );

          return {
            prescriptionDetailId: Number(saved.PrescriptionDetailId),
            medicineId: Number(saved.MedicineId),
            medicineName: saved.MedicineName,
            stockQuantity: Number(saved.StockQuantity ?? medicine?.StockQuantity ?? 0),
            quantity: Number(saved.Quantity),
            dosage: saved.Dosage || "",
            frequency: usage.frequency,
            duration: usage.duration,
            instruction: usage.instruction,
          };
        })
      );
    } catch (error: any) {
      console.error(error);
    }
  }

  function closePrescriptionForm() {
    setShowPrescriptionForm(false);
    setSelectedExamination(null);
    setPrescriptionItems([]);
    setSavedPrescriptionId(null);
    setCurrentMedicine({});
  }

  function handleAddMedicine() {
    if (!currentMedicine.medicineId || !currentMedicine.quantity) {
      alert("Vui lòng chọn thuốc và nhập số lượng");
      return;
    }
    const med = medicines.find(m => m.MedicineId === Number(currentMedicine.medicineId));
    if (!med) return;

    const quantity = Number(currentMedicine.quantity);
    const stockQuantity = Number(med.StockQuantity ?? 0);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert("Số lượng thuốc phải là số nguyên lớn hơn 0.");
      return;
    }

    if (prescriptionItems.some((item) => item.medicineId === Number(med.MedicineId))) {
      alert("Thuốc này đã có trong đơn.");
      return;
    }

    if (quantity > stockQuantity) {
      alert(`Số lượng kê đơn không được vượt tồn kho hiện có (${stockQuantity}).`);
      return;
    }

    const nextItem: PrescriptionItemData = {
      medicineId: Number(currentMedicine.medicineId),
      medicineName: med.MedicineName,
      stockQuantity,
      quantity,
      dosage: currentMedicine.dosage || "",
      frequency: currentMedicine.frequency || "",
      duration: currentMedicine.duration || "",
      instruction: currentMedicine.instruction || ""
    };

    if (savedPrescriptionId) {
      axiosClient
        .post(`/prescriptions/${savedPrescriptionId}/details`, {
          medicineId: nextItem.medicineId,
          quantity: nextItem.quantity,
          dosage: nextItem.dosage,
          usageInstruction: [
            nextItem.frequency ? `Tần suất: ${nextItem.frequency}` : "",
            nextItem.duration ? `Thời gian: ${nextItem.duration}` : "",
            nextItem.instruction ? `HD: ${nextItem.instruction}` : "",
          ].filter(Boolean).join(". "),
        })
        .then((response) => {
          setPrescriptionItems([
            ...prescriptionItems,
            {
              ...nextItem,
              prescriptionDetailId:
                Number(
                  response.data.data?.output?.NewPrescriptionDetailId ||
                    response.data.data?.data?.PrescriptionDetailId
                ) || undefined,
            },
          ]);
        })
        .catch((error) => {
          alert(error.response?.data?.message || "Thêm thuốc vào đơn thất bại.");
        });
    } else {
      setPrescriptionItems([...prescriptionItems, nextItem]);
    }

    setCurrentMedicine({
      medicineId: undefined,
      quantity: undefined,
      dosage: "",
      frequency: "",
      duration: "",
      instruction: ""
    });
  }

  async function handleRemoveMedicine(index: number) {
    const item = prescriptionItems[index];

    if (item?.prescriptionDetailId) {
      try {
        await axiosClient.delete(`/prescriptions/details/${item.prescriptionDetailId}`);
      } catch (error: any) {
        alert(error.response?.data?.message || "Xóa thuốc khỏi đơn thất bại.");
        return;
      }
    }

    const newItems = [...prescriptionItems];
    newItems.splice(index, 1);
    setPrescriptionItems(newItems);

    if (newItems.length === 0) {
      setSavedPrescriptionId(null);
    }
  }

  async function handleSavePrescription() {
    if (!doctorId) {
      alert("Không tìm thấy hồ sơ bác sĩ của tài khoản hiện tại.");
      return;
    }

    if (!selectedExamination?.ExaminationId) {
      alert("ExaminationId không hợp lệ");
      return;
    }
    if (prescriptionItems.length === 0) {
      alert("Vui lòng kê ít nhất 1 loại thuốc");
      return;
    }

    if (savedPrescriptionId) {
      alert("Don thuoc nay da duoc luu truoc do.");
      return;
    }

    const invalidItem = prescriptionItems.find(
      (item) => item.quantity > item.stockQuantity
    );

    if (invalidItem) {
      alert(
        `So luong ${invalidItem.medicineName} vuot ton kho hien co (${invalidItem.stockQuantity}).`
      );
      return;
    }

    try {
      setSubmittingPrescription(true);
      const response = await axiosClient.post("/prescriptions", {
        examinationId: selectedExamination.ExaminationId,
        doctorId,
        items: prescriptionItems
      });

      if (!response.data.success) {
        alert(response.data.message || "Không thể tạo đơn thuốc");
        return;
      }

      alert("Tạo đơn thuốc thành công");
      setSavedPrescriptionId(Number(response.data.data?.prescriptionId || 0) || null);
      closePrescriptionForm();
      await loadQueue();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi tạo đơn thuốc");
    } finally {
      setSubmittingPrescription(false);
    }
  }

  useEffect(() => {
    resolveCurrentDoctorId().then((resolvedDoctorId) => {
      if (resolvedDoctorId) {
        loadQueue(resolvedDoctorId);
      }
    });
  }, []);

  const inProgressExamination = queue.find(
    (item) => normalizeStatus(item.Status) === "InProgress"
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Hàng chờ khám hôm nay</h1>
        <p className="text-sm text-gray-500">
          Danh sách bệnh nhân đã check-in và đang chờ bác sĩ khám
        </p>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {pageError}
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Danh sách bệnh nhân</h2>
          <p className="text-sm text-gray-500">Tổng cộng {queue.length} bệnh nhân</p>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-5 py-3">Giờ</th>
                <th className="text-left px-5 py-3">Bệnh nhân</th>
                <th className="text-left px-5 py-3">Phòng</th>
                <th className="text-left px-5 py-3">Lý do khám</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-gray-500">
                    Chưa có bệnh nhân nào trong hàng chờ
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.AppointmentId} className="border-t">
                    <td className="px-5 py-4 font-medium">{formatTime(item.AppointmentTime)}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{item.PatientName}</div>
                      <div className="text-xs text-gray-500">Mã BN: {item.PatientId}</div>
                    </td>
                    <td className="px-5 py-4">
                      {item.RoomName || item.RoomCode || "-"}
                    </td>
                    <td className="px-5 py-4">{item.Reason || "-"}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                        {statusMap[normalizeStatus(item.Status)] || item.Status || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {["Waiting", "CheckedIn"].includes(normalizeStatus(item.Status)) ? (
                        <button
                          onClick={() => handleStartExamination(item)}
                          disabled={Boolean(inProgressExamination)}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          Bắt đầu khám
                        </button>
                      ) : normalizeStatus(item.Status) === "InProgress" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openDiagnosisForm(item)}
                            className="rounded-xl bg-green-600 px-3 py-2 text-white hover:bg-green-700 text-xs"
                          >
                            Nhập chẩn đoán
                          </button>
                          <button
                            onClick={() => openPrescriptionForm(item)}
                            className="rounded-xl bg-purple-600 px-3 py-2 text-white hover:bg-purple-700 text-xs"
                          >
                            Kê đơn thuốc
                          </button>
                          <button
                            onClick={() => handleFinishExamination(item)}
                            className="rounded-xl bg-orange-600 px-3 py-2 text-white hover:bg-orange-700 text-xs"
                          >
                            Hoàn tất khám
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Diagnosis Form Modal */}
      {showDiagnosisForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Nhập chẩn đoán</h2>
              <p className="text-sm text-gray-500">
                Bệnh nhân: {selectedExamination?.PatientName}
              </p>
            </div>

            {/* Form Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium mb-2">Triệu chứng</label>
                <textarea
                  value={diagnosisForm.symptoms}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, symptoms: e.target.value })
                  }
                  placeholder="Mô tả triệu chứng bệnh nhân..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium mb-2">Chẩn đoán *</label>
                <textarea
                  value={diagnosisForm.diagnosis}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, diagnosis: e.target.value })
                  }
                  placeholder="Nhập kết luận chẩn đoán..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Treatment */}
              <div>
                <label className="block text-sm font-medium mb-2">Điều trị</label>
                <textarea
                  value={diagnosisForm.treatment}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, treatment: e.target.value })
                  }
                  placeholder="Hướng dẫn điều trị..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú khác</label>
                <textarea
                  value={diagnosisForm.notes}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, notes: e.target.value })
                  }
                  placeholder="Ghi chú thêm..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={closeDiagnosisForm}
                disabled={submittingDiagnosis}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveDiagnosis}
                disabled={submittingDiagnosis}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingDiagnosis ? "Đang lưu..." : "Lưu chẩn đoán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Kê đơn thuốc</h2>
              <p className="text-sm text-gray-500">
                Bệnh nhân: {selectedExamination?.PatientName}
              </p>
            </div>

            {/* Form Body */}
            <div className="px-6 py-5 flex-1 overflow-y-auto space-y-6">
              {/* Add Medicine Section */}
              <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                <h3 className="font-medium text-sm">Thêm thuốc vào đơn</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Chọn thuốc *</label>
                    <select
                      value={currentMedicine.medicineId || ""}
                      onChange={(e) => setCurrentMedicine({ ...currentMedicine, medicineId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">-- Chọn thuốc --</option>
                      {medicines.map(m => (
                        <option key={m.MedicineId} value={m.MedicineId}>
                          {m.MedicineName} (Tồn: {m.StockQuantity} {m.Unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Số lượng *</label>
                    <input
                      type="number"
                      min="1"
                      max={
                        medicines.find(
                          (m) => Number(m.MedicineId) === Number(currentMedicine.medicineId)
                        )?.StockQuantity ?? undefined
                      }
                      value={currentMedicine.quantity || ""}
                      onChange={(e) => setCurrentMedicine({ ...currentMedicine, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Liều dùng</label>
                    <input
                      type="text"
                      placeholder="VD: 1 viên/lần"
                      value={currentMedicine.dosage || ""}
                      onChange={(e) => setCurrentMedicine({ ...currentMedicine, dosage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tần suất</label>
                    <input
                      type="text"
                      placeholder="VD: 2 lần/ngày"
                      value={currentMedicine.frequency || ""}
                      onChange={(e) => setCurrentMedicine({ ...currentMedicine, frequency: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Thời gian</label>
                    <input
                      type="text"
                      placeholder="VD: 5 ngày"
                      value={currentMedicine.duration || ""}
                      onChange={(e) => setCurrentMedicine({ ...currentMedicine, duration: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <label className="block text-xs font-medium mb-1">Hướng dẫn</label>
                    <input
                      type="text"
                      placeholder="VD: Uống sau ăn"
                      value={currentMedicine.instruction || ""}
                      onChange={(e) => setCurrentMedicine({ ...currentMedicine, instruction: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddMedicine}
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium"
                  >
                    + Thêm vào đơn
                  </button>
                </div>
              </div>

              {/* Medicine List */}
              <div>
                <h3 className="font-medium text-sm mb-3">Danh sách thuốc đã kê ({prescriptionItems.length})</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2">Thuốc</th>
                        <th className="text-center px-4 py-2">SL</th>
                        <th className="text-left px-4 py-2">Cách dùng</th>
                        <th className="text-right px-4 py-2">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptionItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center px-4 py-6 text-gray-500">
                            Chưa có thuốc nào
                          </td>
                        </tr>
                      ) : (
                        prescriptionItems.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 font-medium">{item.medicineName}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-xs text-gray-600">
                              {item.dosage} {item.dosage && item.frequency && "-"} {item.frequency}
                              {(item.dosage || item.frequency) && item.duration && "-"} {item.duration}
                              {(item.dosage || item.frequency || item.duration) && item.instruction && <br />}
                              {item.instruction}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleRemoveMedicine(idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={closePrescriptionForm}
                disabled={submittingPrescription}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePrescription}
                disabled={
                  submittingPrescription ||
                  prescriptionItems.length === 0 ||
                  Boolean(savedPrescriptionId)
                }
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingPrescription ? "Đang lưu..." : "Lưu đơn thuốc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
