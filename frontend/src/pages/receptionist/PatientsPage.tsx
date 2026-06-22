import { useEffect, useState } from "react";
import { Edit, Loader2, Plus, Search, UserRound, X } from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface Patient {
  PatientId: number;
  UserId: number | null;
  PatientCode: string;
  FullName: string;
  Gender: string | null;
  DateOfBirth: string | null;
  Age?: number;
  Phone: string | null;
  Email: string | null;
  Address: string | null;
  HealthInsuranceNumber: string | null;
  EmergencyContactName: string | null;
  EmergencyContactPhone: string | null;
  MedicalRecordId?: number;
  RecordCode?: string;
  CreatedAt?: string;
  UpdatedAt?: string | null;
}

type ApiPatient = Partial<Patient> & Record<string, unknown>;

interface PatientForm {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  healthInsuranceNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const emptyForm: PatientForm = {
  fullName: "",
  gender: "Nam",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  healthInsuranceNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function pickString(source: ApiPatient, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function pickNumber(source: ApiPatient, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number") {
      return value;
    }
  }

  return 0;
}

function normalizePatient(raw: ApiPatient): Patient {
  return {
    PatientId: pickNumber(raw, "PatientId", "patientId"),
    UserId: (raw.UserId as number | null) ?? (raw.userId as number | null) ?? null,
    PatientCode: pickString(raw, "PatientCode", "patientCode"),
    FullName: pickString(raw, "FullName", "fullName"),
    Gender: pickString(raw, "Gender", "gender") || null,
    DateOfBirth: pickString(raw, "DateOfBirth", "dateOfBirth") || null,
    Age: (raw.Age as number | undefined) ?? (raw.age as number | undefined),
    Phone: pickString(raw, "Phone", "phone") || null,
    Email: pickString(raw, "Email", "email") || null,
    Address: pickString(raw, "Address", "address") || null,
    HealthInsuranceNumber:
      pickString(raw, "HealthInsuranceNumber", "healthInsuranceNumber") || null,
    EmergencyContactName:
      pickString(raw, "EmergencyContactName", "emergencyContactName") || null,
    EmergencyContactPhone:
      pickString(raw, "EmergencyContactPhone", "emergencyContactPhone") || null,
    MedicalRecordId:
      (raw.MedicalRecordId as number | undefined) ??
      (raw.medicalRecordId as number | undefined),
    RecordCode: pickString(raw, "RecordCode", "recordCode") || undefined,
    CreatedAt: pickString(raw, "CreatedAt", "createdAt") || undefined,
    UpdatedAt: pickString(raw, "UpdatedAt", "updatedAt") || null,
  };
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN");
}

function displayValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

function cleanPhoneInput(value: string) {
  return value.replace(/[^0-9+\-\s()]/g, "").trim().slice(0, 20);
}

function isValidPhone(value: string) {
  if (!value.trim()) return true;
  return /^[0-9+\-\s()]{6,20}$/.test(value.trim());
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchPatients(searchKeyword = keyword) {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/patients", {
        params: {
          keyword: searchKeyword || undefined,
        },
      });

      const data = Array.isArray(response.data.data) ? response.data.data : [];
      const uniquePatients = new Map<number, Patient>();

      for (const item of data) {
        const patient = normalizePatient(item);

        if (!uniquePatients.has(patient.PatientId)) {
          uniquePatients.set(patient.PatientId, patient);
        }
      }

      setPatients(Array.from(uniquePatients.values()));
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Không thể tải danh sách bệnh nhân.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients("");
  }, []);

  function openCreateForm() {
    setEditingPatient(null);
    setForm(emptyForm);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function openEditForm(patient: Patient) {
    setEditingPatient(patient);

    setForm({
      fullName: patient.FullName || "",
      gender: patient.Gender || "Nam",
      dateOfBirth: patient.DateOfBirth ? patient.DateOfBirth.substring(0, 10) : "",
      phone: patient.Phone || "",
      email: patient.Email || "",
      address: patient.Address || "",
      healthInsuranceNumber: patient.HealthInsuranceNumber || "",
      emergencyContactName: patient.EmergencyContactName || "",
      emergencyContactPhone: patient.EmergencyContactPhone || "",
    });

    setShowForm(true);
    setMessage("");
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingPatient(null);
    setForm(emptyForm);
  }

  function handleChange(name: keyof PatientForm, value: string) {
    setError("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhoneChange(
    name: "phone" | "emergencyContactPhone",
    value: string
  ) {
    handleChange(name, cleanPhoneInput(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      phone: cleanPhoneInput(form.phone),
      emergencyContactPhone: cleanPhoneInput(form.emergencyContactPhone),
    };

    if (!isValidPhone(payload.phone)) {
      setError("Số điện thoại không hợp lệ.");
      setSaving(false);
      return;
    }

    if (!isValidPhone(payload.emergencyContactPhone)) {
      setError("SĐT khẩn cấp không hợp lệ.");
      setSaving(false);
      return;
    }

    try {
      if (editingPatient) {
        await axiosClient.put(`/patients/${editingPatient.PatientId}`, payload);
        setMessage("Cập nhật bệnh nhân thành công.");
      } else {
        await axiosClient.post("/patients", payload);
        setMessage("Tạo bệnh nhân thành công.");
      }

      closeForm();
      await fetchPatients();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Lưu thông tin bệnh nhân thất bại.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await fetchPatients(keyword);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Quản lý bệnh nhân
          </h1>
          <p className="mt-2 text-slate-500">
            Tìm kiếm, tạo mới và cập nhật hồ sơ bệnh nhân.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700"
        >
          <Plus size={20} />
          Thêm bệnh nhân
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã, tên, số điện thoại..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Tìm kiếm
          </button>

          <button
            type="button"
            onClick={() => {
              setKeyword("");
              fetchPatients("");
            }}
            className="rounded-2xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Làm mới
          </button>
        </form>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh sách bệnh nhân
            </h2>
            <p className="text-sm text-slate-500">
              Tổng cộng {patients.length} hồ sơ
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-sky-600">
              <Loader2 className="animate-spin" size={18} />
              Đang tải...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-6 py-4 font-semibold">Mã BN</th>
                <th className="px-6 py-4 font-semibold">Họ tên</th>
                <th className="px-6 py-4 font-semibold">Giới tính</th>
                <th className="px-6 py-4 font-semibold">Ngày sinh</th>
                <th className="px-6 py-4 font-semibold">SĐT</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">BHYT</th>
                <th className="px-6 py-4 font-semibold">Liên hệ khẩn cấp</th>
                <th className="px-6 py-4 font-semibold">SĐT khẩn cấp</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.PatientId}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-semibold text-sky-700">
                    {displayValue(patient.PatientCode)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {displayValue(patient.FullName)}
                        </p>
                        <p className="text-xs text-slate-400">
                          ID: {patient.PatientId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {displayValue(patient.Gender)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(patient.DateOfBirth)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {displayValue(patient.Phone)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {displayValue(patient.Email)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {displayValue(patient.HealthInsuranceNumber)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {displayValue(patient.EmergencyContactName)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {displayValue(patient.EmergencyContactPhone)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(patient)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200"
                    >
                      <Edit size={16} />
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    Chưa có bệnh nhân nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPatient ? "Cập nhật bệnh nhân" : "Thêm bệnh nhân mới"}
                </h2>
                <p className="text-sm text-slate-500">
                  Nhập đầy đủ thông tin hồ sơ bệnh nhân.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(92vh-84px)] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Họ tên *
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Giới tính
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    placeholder="0988888889"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange("phone", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mã BHYT
                  </label>
                  <input
                    value={form.healthInsuranceNumber}
                    onChange={(e) =>
                      handleChange("healthInsuranceNumber", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Địa chỉ
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Người liên hệ khẩn cấp
                  </label>
                  <input
                    value={form.emergencyContactName}
                    onChange={(e) =>
                      handleChange("emergencyContactName", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    SĐT khẩn cấp
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    placeholder="0901234567"
                    value={form.emergencyContactPhone}
                    onChange={(e) =>
                      handlePhoneChange("emergencyContactPhone", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  {editingPatient ? "Lưu cập nhật" : "Tạo bệnh nhân"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
