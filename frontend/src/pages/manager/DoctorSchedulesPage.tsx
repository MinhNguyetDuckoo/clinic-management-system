import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Edit3, Loader2, Plus, Power, RefreshCcw, X } from "lucide-react";
import axiosClient from "../../api/axiosClient";

type Doctor = {
  DoctorId: number;
  DoctorName: string;
  SpecialtyName?: string;
};

type Room = {
  RoomId: number;
  RoomName: string;
  RoomType?: string;
};

type Schedule = {
  ScheduleId: number;
  DoctorId: number;
  DoctorName: string;
  RoomId: number;
  RoomName: string;
  WorkDate: string;
  StartTime: string;
  EndTime: string;
  MaxPatients: number;
  IsActive: boolean;
};

type ScheduleForm = {
  doctorId: string;
  roomId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  maxPatients: string;
  isActive: boolean;
};

const emptyForm: ScheduleForm = {
  doctorId: "",
  roomId: "",
  workDate: "",
  startTime: "08:00",
  endTime: "17:00",
  maxPatients: "20",
  isActive: true
};

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatTime(value?: string) {
  if (!value) return "-";
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
}

function statusClass(isActive: boolean) {
  return isActive
    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";
}

export default function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filters, setFilters] = useState({ doctorId: "", workDate: "", isActive: "" });
  const [form, setForm] = useState<ScheduleForm>({ ...emptyForm, workDate: todayString() });
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  async function loadLookups() {
    const [doctorRes, roomRes] = await Promise.all([
      axiosClient.get("/doctors"),
      axiosClient.get("/rooms")
    ]);
    setDoctors(doctorRes.data.data || []);
    setRooms(roomRes.data.data || []);
  }

  async function loadSchedules() {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/doctor-schedules", {
        params: {
          doctorId: filters.doctorId || undefined,
          workDate: filters.workDate || undefined,
          isActive: filters.isActive || undefined
        }
      });
      setSchedules(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Khong the tai lich lam viec.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups().catch((err: any) =>
      setError(err.response?.data?.message || "Khong the tai du lieu bac si/phong.")
    );
    loadSchedules();
  }, []);

  function openCreateForm() {
    setEditing(null);
    setForm({
      ...emptyForm,
      doctorId: doctors[0] ? String(doctors[0].DoctorId) : "",
      roomId: rooms[0] ? String(rooms[0].RoomId) : "",
      workDate: todayString()
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(schedule: Schedule) {
    setEditing(schedule);
    setForm({
      doctorId: String(schedule.DoctorId),
      roomId: String(schedule.RoomId || ""),
      workDate: schedule.WorkDate.substring(0, 10),
      startTime: formatTime(schedule.StartTime),
      endTime: formatTime(schedule.EndTime),
      maxPatients: String(schedule.MaxPatients),
      isActive: Boolean(schedule.IsActive)
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm, workDate: todayString() });
    setFormError("");
  }

  function validateForm() {
    if (!form.doctorId && !editing) return "Vui long chon bac si.";
    if (!form.roomId) return "Vui long chon phong.";
    if (!form.workDate) return "Vui long chon ngay lam viec.";
    if (!form.startTime || !form.endTime) return "Vui long nhap gio lam viec.";
    if (form.startTime >= form.endTime) return "Gio bat dau phai nho hon gio ket thuc.";
    if (Number(form.maxPatients) <= 0) return "So benh nhan toi da phai lon hon 0.";
    return "";
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    setFormError("");

    const payload = {
      doctorId: Number(form.doctorId),
      roomId: Number(form.roomId),
      workDate: form.workDate,
      startTime: form.startTime,
      endTime: form.endTime,
      maxPatients: Number(form.maxPatients),
      isActive: form.isActive
    };

    try {
      if (editing) {
        await axiosClient.put(`/doctor-schedules/${editing.ScheduleId}`, {
          roomId: payload.roomId,
          workDate: payload.workDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
          maxPatients: payload.maxPatients,
          isActive: payload.isActive
        });
        setMessage("Cap nhat lich lam viec thanh cong.");
      } else {
        await axiosClient.post("/doctor-schedules", payload);
        setMessage("Tao lich lam viec thanh cong.");
      }

      closeForm();
      await loadSchedules();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Luu lich lam viec that bai.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(schedule: Schedule) {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await axiosClient.patch(`/doctor-schedules/${schedule.ScheduleId}/status`, {
        isActive: !schedule.IsActive
      });
      setMessage(schedule.IsActive ? "Da tam ngung lich lam viec." : "Da kich hoat lich lam viec.");
      await loadSchedules();
    } catch (err: any) {
      setError(err.response?.data?.message || "Khong the cap nhat trang thai lich.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lich bac si</h1>
          <p className="mt-2 text-slate-500">Tao va cap nhat ca lam viec cua bac si.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadSchedules}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            <RefreshCcw size={18} />
            Lam moi
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
          >
            <Plus size={18} />
            Tao lich
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select
            value={filters.doctorId}
            onChange={(event) => setFilters((prev) => ({ ...prev, doctorId: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Tat ca bac si</option>
            {doctors.map((doctor) => (
              <option key={doctor.DoctorId} value={doctor.DoctorId}>
                {doctor.DoctorName}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.workDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, workDate: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
          />

          <select
            value={filters.isActive}
            onChange={(event) => setFilters((prev) => ({ ...prev, isActive: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Tat ca trang thai</option>
            <option value="true">Dang hoat dong</option>
            <option value="false">Tam ngung</option>
          </select>

          <button
            onClick={loadSchedules}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CalendarDays size={18} />}
            Loc
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Bac si</th>
                <th className="px-6 py-4 font-semibold">Phong</th>
                <th className="px-6 py-4 font-semibold">Ngay</th>
                <th className="px-6 py-4 font-semibold">Bat dau</th>
                <th className="px-6 py-4 font-semibold">Ket thuc</th>
                <th className="px-6 py-4 font-semibold">Toi da</th>
                <th className="px-6 py-4 font-semibold">Trang thai</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.ScheduleId} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{schedule.DoctorName}</td>
                  <td className="px-6 py-4 text-slate-600">{schedule.RoomName || "-"}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(schedule.WorkDate)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatTime(schedule.StartTime)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatTime(schedule.EndTime)}</td>
                  <td className="px-6 py-4 text-slate-600">{schedule.MaxPatients}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(schedule.IsActive)}`}>
                      {schedule.IsActive ? "Dang hoat dong" : "Tam ngung"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditForm(schedule)}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 font-medium text-sky-700 hover:bg-sky-100"
                      >
                        <Edit3 size={16} />
                        Sua
                      </button>
                      <button
                        onClick={() => changeStatus(schedule)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <Power size={16} />
                        {schedule.IsActive ? "Tam ngung" : "Kich hoat"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && schedules.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Chua co lich lam viec phu hop.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editing ? "Sua lich lam viec" : "Tao lich lam viec"}
              </h2>
              <button onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Bac si</label>
                  <select
                    value={form.doctorId}
                    onChange={(event) => setForm((prev) => ({ ...prev, doctorId: event.target.value }))}
                    disabled={Boolean(editing)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-70"
                  >
                    <option value="">Chon bac si</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.DoctorId} value={doctor.DoctorId}>
                        {doctor.DoctorName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Phong</label>
                  <select
                    value={form.roomId}
                    onChange={(event) => setForm((prev) => ({ ...prev, roomId: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Chon phong</option>
                    {rooms.map((room) => (
                      <option key={room.RoomId} value={room.RoomId}>
                        {room.RoomName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Ngay lam viec</label>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, workDate: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">So benh nhan toi da</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxPatients}
                    onChange={(event) => setForm((prev) => ({ ...prev, maxPatients: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Gio bat dau</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Gio ket thuc</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4"
                />
                Dang hoat dong
              </label>

              {formError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200">
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  Luu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
