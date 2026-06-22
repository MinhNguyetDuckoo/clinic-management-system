import { useEffect, useState } from "react";
import { Eye, Search, Users, X } from "lucide-react";
import axiosClient from "../../api/axiosClient";

type Patient = {
  PatientId?: number;
  PatientCode?: string;
  FullName?: string;
  Gender?: string;
  DateOfBirth?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  InsuranceNumber?: string;
  HealthInsuranceNumber?: string;
  BHYTCode?: string;
  BHYT?: string;
  EmergencyContactName?: string;
  EmergencyContactPhone?: string;
  IsDeleted?: boolean | number;
  CreatedAt?: string;
  UpdatedAt?: string;
};

type PatientDetail = {
  patient: Patient;
  appointments: any[];
  examinations: any[];
  invoices: any[];
};

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hoạt động" },
  { value: "deleted", label: "Đã ẩn / Đã xóa mềm" }
];

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatTime(value?: string) {
  if (!value) return "-";
  if (value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC"
      });
    }
  }

  const match = value.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : value;
}

function formatMoney(value?: number) {
  if (value === undefined || value === null) return "-";
  return Number(value).toLocaleString("vi-VN") + " ₫";
}

function isDeleted(patient?: Patient) {
  return patient?.IsDeleted === true || patient?.IsDeleted === 1;
}

function getBhyt(patient?: Patient) {
  return patient?.BHYT || patient?.InsuranceNumber || patient?.HealthInsuranceNumber || patient?.BHYTCode || "-";
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<PatientDetail | null>(null);

  const loadPatients = () => {
    setLoading(true);
    setError(null);

    axiosClient
      .get("/admin/patients", {
        params: {
          status,
          keyword: keyword.trim() || undefined,
          limit: 200
        }
      })
      .then((res) => {
        const contentType = String(res.headers["content-type"] || "");
        if (!contentType?.includes("application/json")) {
          throw new Error("API không trả về JSON. Vui lòng kiểm tra base URL/proxy backend.");
        }
        if (res.data.success) {
          setPatients(res.data.data || []);
        } else {
          setError(res.data.message || "Không thể tải danh sách bệnh nhân.");
        }
      })
      .catch((err) => {
        setPatients([]);
        setError(err.response?.data?.message || err.message || "Không thể tải danh sách bệnh nhân.");
      })
      .finally(() => setLoading(false));
  };

  const loadPatientDetail = (patient: Patient) => {
    if (!patient.PatientId) return;
    setDetailLoading(true);
    setDetailError(null);
    setSelectedDetail(null);

    axiosClient
      .get(`/admin/patients/${patient.PatientId}`)
      .then((res) => {
        if (res.data.success) {
          setSelectedDetail(res.data.data);
        } else {
          setDetailError(res.data.message || "Không thể tải chi tiết bệnh nhân.");
        }
      })
      .catch((err) => {
        setDetailError(err.response?.data?.message || err.message || "Không thể tải chi tiết bệnh nhân.");
      })
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    loadPatients();
  }, [status]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    loadPatients();
  };

  const closeDetail = () => {
    setSelectedDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Danh sách bệnh nhân</h1>
            <p className="mt-1 text-slate-500">
              Admin có thể xem cả bệnh nhân đang hoạt động và bệnh nhân đã bị ẩn theo nghiệp vụ.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  status === option.value
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex w-full gap-2 lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-2 pl-10 pr-4 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Tìm theo tên, mã BN, số điện thoại"
              />
            </div>
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800">
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Mã BN</th>
                <th className="px-5 py-4">Họ tên</th>
                <th className="px-5 py-4">Giới tính</th>
                <th className="px-5 py-4">Ngày sinh</th>
                <th className="px-5 py-4">SĐT</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">BHYT</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {patients.map((patient) => (
                <tr key={patient.PatientId || patient.PatientCode} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-900">{patient.PatientCode || "-"}</td>
                  <td className="px-5 py-4">{patient.FullName || "-"}</td>
                  <td className="px-5 py-4">{patient.Gender || "-"}</td>
                  <td className="px-5 py-4">{formatDate(patient.DateOfBirth)}</td>
                  <td className="px-5 py-4">{patient.Phone || "-"}</td>
                  <td className="px-5 py-4">{patient.Email || "-"}</td>
                  <td className="px-5 py-4">{getBhyt(patient)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isDeleted(patient) ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {isDeleted(patient) ? "Đã ẩn / Đã xóa mềm" : "Đang hoạt động"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => loadPatientDetail(patient)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Eye size={14} />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && patients.length === 0 && (
          <div className="p-8 text-center text-slate-500">Không có bệnh nhân phù hợp với bộ lọc hiện tại.</div>
        )}
        {loading && <div className="p-8 text-center text-slate-500">Đang tải danh sách bệnh nhân...</div>}
      </div>

      {(detailLoading || detailError || selectedDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Chi tiết bệnh nhân</h2>
                <p className="text-sm text-slate-500">Dữ liệu lấy trực tiếp từ backend API quản trị.</p>
              </div>
              <button onClick={closeDetail} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {detailLoading && <div className="p-6 text-center text-slate-500">Đang tải chi tiết bệnh nhân...</div>}
            {detailError && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{detailError}</div>}

            {selectedDetail && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedDetail.patient.FullName || "-"}</h3>
                      <p className="text-sm text-slate-500">{selectedDetail.patient.PatientCode || "-"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isDeleted(selectedDetail.patient) ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {isDeleted(selectedDetail.patient) ? "Đã ẩn / Đã xóa mềm" : "Đang hoạt động"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                    <p><b>Giới tính:</b> {selectedDetail.patient.Gender || "-"}</p>
                    <p><b>Ngày sinh:</b> {formatDate(selectedDetail.patient.DateOfBirth)}</p>
                    <p><b>SĐT:</b> {selectedDetail.patient.Phone || "-"}</p>
                    <p><b>Email:</b> {selectedDetail.patient.Email || "-"}</p>
                    <p><b>BHYT:</b> {getBhyt(selectedDetail.patient)}</p>
                    <p><b>Ngày tạo:</b> {formatDate(selectedDetail.patient.CreatedAt)}</p>
                    <p className="md:col-span-2 lg:col-span-3"><b>Địa chỉ:</b> {selectedDetail.patient.Address || "-"}</p>
                    <p><b>Liên hệ khẩn cấp:</b> {selectedDetail.patient.EmergencyContactName || "-"}</p>
                    <p><b>SĐT khẩn cấp:</b> {selectedDetail.patient.EmergencyContactPhone || "-"}</p>
                  </div>
                </div>

                <DetailTable title="Lịch hẹn gần đây" items={selectedDetail.appointments} empty="Chưa có lịch hẹn gần đây." columns={[
                  ["AppointmentDate", "Ngày", formatDate],
                  ["AppointmentTime", "Giờ", formatTime],
                  ["DoctorName", "Bác sĩ"],
                  ["RoomName", "Phòng"],
                  ["Status", "Trạng thái"],
                  ["Reason", "Lý do"]
                ]} />

                <DetailTable title="Phiếu khám gần đây" items={selectedDetail.examinations} empty="Chưa có phiếu khám gần đây." columns={[
                  ["Diagnosis", "Chẩn đoán"],
                  ["Conclusion", "Kết luận"],
                  ["Status", "Trạng thái"],
                  ["StartedAt", "Bắt đầu", formatDate],
                  ["FinishedAt", "Kết thúc", formatDate]
                ]} />

                <DetailTable title="Hóa đơn gần đây" items={selectedDetail.invoices} empty="Chưa có hóa đơn gần đây." columns={[
                  ["InvoiceId", "Mã HĐ"],
                  ["TotalAmount", "Tổng tiền", formatMoney],
                  ["Status", "Trạng thái"],
                  ["CreatedAt", "Ngày tạo", formatDate],
                  ["PaidAt", "Ngày thanh toán", formatDate]
                ]} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailTable({
  title,
  items,
  columns,
  empty
}: {
  title: string;
  items: any[];
  columns: [string, string, ((value: any) => string)?][];
  empty: string;
}) {
  return (
    <div>
      <h3 className="mb-3 font-bold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{empty}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                {columns.map(([key, label]) => (
                  <th key={key} className="px-4 py-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={item.AppointmentId || item.ExaminationId || item.InvoiceId || index}>
                  {columns.map(([key, _label, formatter]) => (
                    <td key={key} className="px-4 py-3 text-slate-700">
                      {formatter ? formatter(item[key]) : item[key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
