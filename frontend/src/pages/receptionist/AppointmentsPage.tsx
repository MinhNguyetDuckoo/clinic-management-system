import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Search,
  UserRound,
  X,
  XCircle
} from "lucide-react";
import axiosClient from "../../api/axiosClient";


interface Appointment {
  AppointmentId: number;
  AppointmentDate: string;
  AppointmentTime: string;
  Status: string;
  Reason: string | null;
  CancelReason: string | null;
  PatientId: number;
  PatientCode: string;
  PatientName: string;
  PatientPhone: string | null;
  PatientGender: string | null;
  PatientDateOfBirth: string | null;
  DoctorId: number;
  DoctorName: string;
  SpecialtyName: string;
  RoomId: number;
  RoomName: string;
  CreatedAt: string;
}

const statusFilters = [
  { value: "All", label: "Tất cả" },
  { value: "Scheduled", label: "Đang chờ" },
  { value: "CheckedIn", label: "Đã check-in" },
  { value: "InProgress", label: "Đang khám" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "NoShow", label: "Không đến" }
];

interface CancelDialogState {
  appointment: Appointment;
  reason: string;
}

interface Patient {
  PatientId: number;
  PatientCode: string;
  FullName: string;
  Phone: string | null;
}

interface Doctor {
  DoctorId: number;
  UserId: number;
  DoctorName: string;
  SpecialtyName: string;
}

interface Room {
  RoomId: number;
  RoomName: string;
  RoomType: string;
}

interface DoctorSchedule {
  ScheduleId: number;
  DoctorId: number;
  RoomId: number | null;
  RoomName: string | null;
  WorkDate: string;
  StartTime: string;
  EndTime: string;
  MaxPatients: number;
}

interface AppointmentForm {
  patientId: string;
  doctorId: string;
  roomId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
}

const emptyForm: AppointmentForm = {
  patientId: "",
  doctorId: "",
  roomId: "",
  appointmentDate: "",
  appointmentTime: "11:00",
  reason: ""
};

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatTime(time?: string | null) {
  if (!time) return "-";
  if (time.includes("T")) {
    return time.substring(11, 16);
  }

  const match = time.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : time;
}

function normalizeTime(time: string) {
  if (!time) return "";

  // Handle AM/PM format (e.g., "08:35 PM" or "12:00 AM")
  let hour: string;
  let minute: string;

  if (time.includes(" AM") || time.includes(" PM")) {
    const ampmMatch = time.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2];
      const period = ampmMatch[3].toUpperCase();

      // Convert 12-hour to 24-hour
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;

      hour = String(h).padStart(2, "0");
      minute = m.padStart(2, "0");
    } else {
      return "";
    }
  } else {
    // Handle 24-hour format (e.g., "14:35")
    const parts = time.split(":");
    hour = parts[0]?.padStart(2, "0") || "00";
    minute = parts[1]?.padStart(2, "0") || "00";
  }

  return `${hour}:${minute}:00`;
}

function findScheduleForTime(schedules: DoctorSchedule[], time: string) {
  const selectedTime = normalizeTime(time).substring(0, 5);

  return schedules.find(
    (schedule) =>
      selectedTime >= formatTime(schedule.StartTime) &&
      selectedTime < formatTime(schedule.EndTime)
  );
}

function currentTimeString() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}`;
}

function isActiveAppointment(status: string) {
  return !["Cancelled", "NoShow"].includes(status);
}

function statusStyle(status: string) {
  switch (status) {
    case "Scheduled":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "CheckedIn":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "InProgress":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "NoShow":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function statusLabel(status: string) {
  return (
    statusFilters.find((item) => item.value === status)?.label || status
  );
}

export default function AppointmentsPage() {
  const [date, setDate] = useState(todayString());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formAppointments, setFormAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [patientKeyword, setPatientKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [slotChecking, setSlotChecking] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState | null>(
    null
  );
  const [form, setForm] = useState<AppointmentForm>({
    ...emptyForm,
    appointmentDate: todayString()
  });

  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  async function getAppointmentsByDate(selectedDate: string) {
    const response = await axiosClient.get("/appointments", {
      params: {
        date: selectedDate
      }
    });

    return response.data.data || [];
  }

  async function fetchAppointments(selectedDate = date) {
    setLoading(true);
    setError("");

    try {
      setAppointments(await getAppointmentsByDate(selectedDate));
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhantomCount() {
    setLoading(true);
    try {
      const response = await axiosClient.get("/appointments/demo/phantom-count", {
        params: { date }
      });
      const data = response.data.data;
      alert(`Đã đếm xong!\n\nLần đọc 1: ${data.count1} lịch hẹn\nLần đọc 2: ${data.count2} lịch hẹn\n\n${data.count1 !== data.count2 ? "PHANTOM READ XẢY RA!" : "Không có thay đổi."}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi báo cáo");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhantomCreate() {
    try {
      const response = await axiosClient.post("/appointments/demo/phantom-create", { date });
      if (response.data.success) {
        alert("Đã tạo 1 lịch hẹn ngẫu nhiên siêu tốc!");
        fetchAppointments(date);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi tạo lịch hẹn");
    }
  }

  async function searchPatients(keyword = patientKeyword) {
    setPatientLoading(true);
    setFormError("");

    try {
      const response = await axiosClient.get("/patients", {
        params: {
          keyword: keyword || undefined
        }
      });

      setPatients(response.data.data || []);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Không thể tìm bệnh nhân.");
    } finally {
      setPatientLoading(false);
    }
  }

  async function loadDoctors(preferFormError = false) {
    setDoctorLoading(true);

    try {
      const response = await axiosClient.get("/doctors");
      const data = response.data.data || [];

      setDoctors(data);
      return data as Doctor[];
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể tải danh sách bác sĩ.";

      if (preferFormError || showForm) {
        setFormError(message);
      } else {
        setError(message);
      }

      return [];
    } finally {
      setDoctorLoading(false);
    }
  }

  async function loadRooms(preferFormError = false) {
    setRoomLoading(true);

    try {
      const response = await axiosClient.get("/rooms");
      const data = response.data.data || [];

      setRooms(data);
      return data as Room[];
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Không thể tải danh sách phòng.";

      if (preferFormError || showForm) {
        setFormError(message);
      } else {
        setError(message);
      }

      return [];
    } finally {
      setRoomLoading(false);
    }
  }

  async function loadDoctorSchedules(doctorId: string, workDate: string) {
    if (!doctorId || !workDate) {
      setDoctorSchedules([]);
      return [];
    }

    setScheduleLoading(true);

    try {
      const response = await axiosClient.get(`/doctors/${doctorId}/schedules`, {
        params: {
          date: workDate
        }
      });
      const data = response.data.data || [];

      setDoctorSchedules(data);
      return data as DoctorSchedule[];
    } catch (err: any) {
      setDoctorSchedules([]);
      setFormError(
        err.response?.data?.message || "Không thể tải lịch làm việc bác sĩ."
      );
      return [];
    } finally {
      setScheduleLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments(date);
    loadDoctors();
    loadRooms();
  }, []);

  useEffect(() => {
    if (!showForm || form.doctorId || doctors.length === 0) return;

    setForm((prev) => ({
      ...prev,
      doctorId: String(doctors[0].DoctorId)
    }));
  }, [showForm, form.doctorId, doctors]);

  useEffect(() => {
    if (!showForm || form.doctorId || form.roomId || rooms.length === 0) return;

    setForm((prev) => ({
      ...prev,
      roomId: String(rooms[0].RoomId)
    }));
  }, [showForm, form.doctorId, form.roomId, rooms]);

  useEffect(() => {
    if (!showForm || !form.appointmentDate) return;

    let isCurrent = true;
    setSlotChecking(true);

    getAppointmentsByDate(form.appointmentDate)
      .then((data) => {
        if (isCurrent) {
          setFormAppointments(data);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setFormAppointments([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setSlotChecking(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [showForm, form.appointmentDate]);

  useEffect(() => {
    if (!showForm) return;

    loadDoctorSchedules(form.doctorId, form.appointmentDate);
  }, [showForm, form.doctorId, form.appointmentDate]);

  useEffect(() => {
    if (!showForm || scheduleLoading) return;

    const schedule = findScheduleForTime(doctorSchedules, form.appointmentTime);
    const firstSchedule = doctorSchedules[0];

    if (!schedule && firstSchedule) {
      const firstScheduleRoomId = firstSchedule.RoomId ? String(firstSchedule.RoomId) : "";
      setForm((prev) => ({
        ...prev,
        appointmentTime: formatTime(firstSchedule.StartTime),
        roomId: firstScheduleRoomId
      }));
      return;
    }

    const scheduleRoomId = schedule?.RoomId ? String(schedule.RoomId) : "";

    if (scheduleRoomId && form.roomId !== scheduleRoomId) {
      setForm((prev) => ({
        ...prev,
        roomId: scheduleRoomId
      }));
    } else if (!scheduleRoomId && form.roomId) {
      setForm((prev) => ({
        ...prev,
        roomId: ""
      }));
    }
  }, [
    showForm,
    scheduleLoading,
    doctorSchedules,
    form.appointmentTime,
    form.roomId
  ]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      doctorId: doctors[0] ? String(doctors[0].DoctorId) : "",
      roomId: "",
      appointmentDate: todayString()
    });
    setFormAppointments([]);
    setDoctorSchedules([]);
    setPatients([]);
    setPatientKeyword("");
    setShowForm(true);
    setMessage("");
    setError("");
    setFormError("");

    if (doctors.length === 0) {
      loadDoctors(true);
    }

    if (rooms.length === 0) {
      loadRooms(true);
    }
  }

  function closeForm() {
    setShowForm(false);
    setForm({
      ...emptyForm,
      appointmentDate: todayString()
    });
    setFormAppointments([]);
    setDoctorSchedules([]);
    setPatients([]);
    setPatientKeyword("");
    setFormError("");
  }

  function handleChange(name: keyof AppointmentForm, value: string) {
    setFormError("");
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleDateChange(value: string) {
    setDate(value);
    await fetchAppointments(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.doctorId) {
      setFormError("Vui lòng chọn bác sĩ trước khi tạo lịch hẹn.");
      return;
    }

    if (!doctors.some((doctor) => String(doctor.DoctorId) === form.doctorId)) {
      setFormError("Bác sĩ đã chọn không còn khả dụng. Vui lòng chọn bác sĩ khác.");
      return;
    }

    if (!form.roomId) {
      setFormError("Vui lòng chọn phòng trước khi tạo lịch hẹn.");
      return;
    }

    if (!rooms.some((room) => String(room.RoomId) === form.roomId)) {
      setFormError("Phòng đã chọn không còn khả dụng. Vui lòng chọn phòng khác.");
      return;
    }

    if (formValidationError) {
      setFormError(formValidationError);
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    setFormError("");

    try {
      await axiosClient.post("/appointments", {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        roomId: Number(form.roomId),
        appointmentDate: form.appointmentDate,
        appointmentTime: normalizeTime(form.appointmentTime),
        reason: form.reason
      });

      setMessage("Tạo lịch hẹn thành công.");
      closeForm();
      await fetchAppointments(form.appointmentDate);
      setDate(form.appointmentDate);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Tạo lịch hẹn thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckIn(appointmentId: number) {
    setActionLoadingId(appointmentId);
    setMessage("");
    setError("");

    try {
      const response = await axiosClient.post(
        `/appointments/${appointmentId}/check-in`
      );

      const examinationId =
        response.data.data?.output?.NewExaminationId ||
        response.data.data?.data?.ExaminationId;

      setMessage(
        examinationId
          ? `Check-in thành công. Phiếu khám: ${examinationId}`
          : "Check-in thành công."
      );

      await fetchAppointments(date);
    } catch (err: any) {
      setError(err.response?.data?.message || "Check-in thất bại.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openCancelDialog(appointment: Appointment) {
    setCancelDialog({
      appointment,
      reason: ""
    });
    setMessage("");
    setError("");
  }

  function closeCancelDialog() {
    setCancelDialog(null);
  }

  async function handleCancel() {
    if (!cancelDialog) return;

    const reason = cancelDialog.reason.trim();

    if (!reason) {
      setError("Vui lòng nhập lý do hủy lịch hẹn.");
      return;
    }

    setActionLoadingId(cancelDialog.appointment.AppointmentId);
    setMessage("");
    setError("");

    try {
      await axiosClient.post(
        `/appointments/${cancelDialog.appointment.AppointmentId}/cancel`,
        { cancelReason: reason }
      );

      setMessage("Hủy lịch hẹn thành công.");
      closeCancelDialog();
      await fetchAppointments(date);
    } catch (err: any) {
      setError(err.response?.data?.message || "Hủy lịch hẹn thất bại.");
    } finally {
      setActionLoadingId(null);
    }
  }

/*
    const reason = window.prompt("Nhập lý do hủy lịch hẹn:");

    if (reason === null) return;

    setActionLoadingId(appointmentId);
    setMessage("");
    setError("");

    try {
      await axiosClient.post(`/appointments/${appointmentId}/cancel`, {
        cancelReason: reason || "Hủy từ giao diện lễ tân"
      });

      setMessage("Hủy lịch hẹn thành công.");
      await fetchAppointments(date);
    } catch (err: any) {
      setError(err.response?.data?.message || "Hủy lịch hẹn thất bại.");
    } finally {
      setActionLoadingId(null);
    }
  }

*/

  const scheduledCount = appointments.filter(
    (item) => item.Status === "Scheduled"
  ).length;

  const checkedInCount = appointments.filter(
    (item) => item.Status === "CheckedIn"
  ).length;

  const completedCount = appointments.filter(
    (item) => item.Status === "Completed"
  ).length;

  const normalizedFormTime = normalizeTime(form.appointmentTime);
  const selectedTime = normalizedFormTime.substring(0, 5);
  const selectedWorkingSchedule = findScheduleForTime(
    doctorSchedules,
    form.appointmentTime
  );
  const scheduledRoomId = selectedWorkingSchedule?.RoomId
    ? String(selectedWorkingSchedule.RoomId)
    : "";
  const scheduledRoomName =
    selectedWorkingSchedule?.RoomName ||
    rooms.find((room) => String(room.RoomId) === scheduledRoomId)?.RoomName ||
    "";
  const isWithinDoctorSchedule =
    !form.doctorId ||
    scheduleLoading ||
    Boolean(selectedWorkingSchedule);
  const selectedDoctorConflict = formAppointments.find(
    (item) =>
      isActiveAppointment(item.Status) &&
      String(item.DoctorId) === form.doctorId &&
      formatTime(item.AppointmentTime) === selectedTime
  );
  const selectedPatientConflict = formAppointments.find(
    (item) =>
      form.patientId &&
      isActiveAppointment(item.Status) &&
      String(item.PatientId) === form.patientId &&
      formatTime(item.AppointmentTime) === selectedTime
  );
  const selectedRoomConflict = formAppointments.find(
    (item) =>
      form.roomId &&
      isActiveAppointment(item.Status) &&
      String(item.RoomId) === form.roomId &&
      formatTime(item.AppointmentTime) === selectedTime
  );
  const isPastAppointment =
    form.appointmentDate < todayString() ||
    (form.appointmentDate === todayString() &&
      normalizedFormTime.substring(0, 5) < currentTimeString());
  const doctorScheduleValidationError =
    form.doctorId && !scheduleLoading && doctorSchedules.length === 0
      ? "Bác sĩ không có lịch làm việc trong ngày này."
      : !isWithinDoctorSchedule
        ? "Giờ hẹn không nằm trong ca làm việc của bác sĩ."
        : "";
  const scheduleRoomValidationError =
    selectedWorkingSchedule && !scheduledRoomId
      ? "Ca lam viec cua bac si chua duoc gan phong kham."
      : selectedWorkingSchedule && form.roomId !== scheduledRoomId
        ? "Phong kham phai khop voi phong da gan trong lich bac si."
        : "";
  const formValidationError = isPastAppointment
    ? "Không thể đặt lịch ở thời gian trong quá khứ."
    : doctorScheduleValidationError
      ? doctorScheduleValidationError
      : scheduleRoomValidationError
        ? scheduleRoomValidationError
      : selectedDoctorConflict
      ? "Bác sĩ đã có lịch hẹn vào thời gian này."
      : selectedRoomConflict
        ? "Phòng đã được sử dụng vào thời gian này."
      : selectedPatientConflict
        ? "Bệnh nhân đã có lịch hẹn vào thời gian này."
        : "";
  const filteredAppointments =
    statusFilter === "All"
      ? appointments
      : appointments.filter((item) => item.Status === statusFilter);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Quản lý lịch hẹn
          </h1>
          <p className="mt-2 text-slate-500">
            Tạo lịch khám, theo dõi trạng thái và check-in bệnh nhân.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePhantomCount}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-white font-semibold shadow-lg shadow-orange-100 hover:bg-orange-600 transition disabled:opacity-50"
          >
            Báo cáo SL (Lỗi Phantom)
          </button>
          <button
            onClick={handlePhantomCreate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-white font-semibold shadow-lg shadow-green-100 hover:bg-green-600 transition disabled:opacity-50"
          >
            Tạo nhanh 1 lịch
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-white font-semibold shadow-lg shadow-sky-100 hover:bg-sky-700 transition"
          >
            <Plus size={20} />
            Tạo lịch hẹn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Đang chờ</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">
            {scheduledCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Đã check-in</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {checkedInCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Hoàn tất</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {completedCount}
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarDays size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Ngày xem lịch</p>
              <p className="font-semibold text-slate-900">
                {formatDate(date)}
              </p>
            </div>
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="md:ml-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            onClick={() => fetchAppointments(date)}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800 transition"
          >
            Tải lại
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-emerald-700">
          {message}
        </div>
      )}

      {error && !showForm && !cancelDialog && (
        <div className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh sách lịch hẹn
            </h2>
            <p className="text-sm text-slate-500">
              Tổng cộng {appointments.length} lịch trong ngày
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === filter.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sky-600 text-sm">
              <Loader2 className="animate-spin" size={18} />
              Đang tải...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-6 py-4 font-semibold">Giờ</th>
                <th className="px-6 py-4 font-semibold">Bệnh nhân</th>
                <th className="px-6 py-4 font-semibold">Bác sĩ</th>
                <th className="px-6 py-4 font-semibold">Phòng</th>
                <th className="px-6 py-4 font-semibold">Lý do</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.map((item) => (
                <tr
                  key={item.AppointmentId}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700">
                      <Clock size={16} />
                      {formatTime(item.AppointmentTime)}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.PatientName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.PatientCode} • {item.PatientPhone || "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">
                      {item.DoctorName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.SpecialtyName}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {item.RoomName || "-"}
                  </td>

                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                    {item.Status === "Cancelled"
                      ? item.CancelReason || item.Reason || "-"
                      : item.Reason || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                        item.Status
                      )}`}
                    >
                      {statusLabel(item.Status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {item.Status === "Scheduled" && (
                        <button
                          onClick={() => handleCheckIn(item.AppointmentId)}
                          disabled={actionLoadingId === item.AppointmentId}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {actionLoadingId === item.AppointmentId ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Check-in
                        </button>
                      )}

                      {["Scheduled", "CheckedIn"].includes(item.Status) && (
                        <button
                          onClick={() => openCancelDialog(item)}
                          disabled={actionLoadingId === item.AppointmentId}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 disabled:opacity-60"
                        >
                          <XCircle size={16} />
                          Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredAppointments.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Chưa có lịch hẹn trong ngày này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Tạo lịch hẹn mới
                </h2>
                <p className="text-sm text-slate-500">
                  Chọn bệnh nhân, bác sĩ, phòng và thời gian khám.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <label className="text-sm font-semibold text-slate-700">
                  Tìm bệnh nhân
                </label>

                <div className="mt-3 flex gap-3">
                  <div className="relative flex-1">
                    <Search
                      size={20}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />
                    <input
                      value={patientKeyword}
                      onChange={(e) => setPatientKeyword(e.target.value)}
                      placeholder="Nhập tên, mã hoặc số điện thoại..."
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => searchPatients(patientKeyword)}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800"
                  >
                    Tìm
                  </button>
                </div>

                {patientLoading && (
                  <div className="mt-4 flex items-center gap-2 text-sky-600 text-sm">
                    <Loader2 className="animate-spin" size={18} />
                    Đang tìm bệnh nhân...
                  </div>
                )}

                {patients.length > 0 && (
                  <div className="mt-4 grid max-h-64 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                    {patients.map((patient) => {
                      const selected =
                        String(patient.PatientId) === form.patientId;

                      return (
                        <button
                          type="button"
                          key={patient.PatientId}
                          onClick={() =>
                            handleChange(
                              "patientId",
                              String(patient.PatientId)
                            )
                          }
                          className={`text-left rounded-2xl border p-4 transition ${
                            selected
                              ? "border-sky-500 bg-sky-50"
                              : "border-slate-100 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">
                            {patient.FullName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {patient.PatientCode} • {patient.Phone || "-"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {form.patientId && (
                  <p className="mt-4 text-sm text-emerald-600 font-medium">
                    Đã chọn PatientId: {form.patientId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Bác sĩ
                  </label>
                  <select
                    value={form.doctorId}
                    onChange={(e) => handleChange("doctorId", e.target.value)}
                    disabled={doctorLoading || doctors.length === 0}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">
                      {doctorLoading ? "Đang tải bác sĩ..." : "Chọn bác sĩ"}
                    </option>
                    {doctors.map((doctor) => (
                      <option key={doctor.DoctorId} value={doctor.DoctorId}>
                        {doctor.DoctorName} - {doctor.SpecialtyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Phòng
                  </label>
                  <select
                    value={form.roomId}
                    onChange={(e) => handleChange("roomId", e.target.value)}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    <option value="">
                      {roomLoading ? "Đang tải phòng..." : "Chọn phòng"}
                    </option>
                    {selectedWorkingSchedule && scheduledRoomId ? (
                      <option value={scheduledRoomId}>{scheduledRoomName}</option>
                    ) : null}
                  </select>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Phong kham duoc lay tu ca lam viec do quan ly thiet lap.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ngày hẹn
                  </label>
                  <input
                    type="date"
                    value={form.appointmentDate}
                    min={todayString()}
                    onChange={(e) =>
                      handleChange("appointmentDate", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Giờ hẹn
                  </label>
                  <input
                    type="time"
                    value={form.appointmentTime}
                    min={
                      form.appointmentDate === todayString()
                        ? currentTimeString()
                        : undefined
                    }
                    onChange={(e) =>
                      handleChange("appointmentTime", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                {(slotChecking || formValidationError) && (
                  <div
                    className={`md:col-span-2 rounded-2xl border px-4 py-3 text-sm ${
                      formValidationError
                        ? "border-red-100 bg-red-50 text-red-600"
                        : "border-sky-100 bg-sky-50 text-sky-700"
                    }`}
                  >
                    {formValidationError ||
                      "Đang kiểm tra lịch bác sĩ trong ngày này..."}
                  </div>
                )}

                {scheduleLoading && (
                  <div className="md:col-span-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Đang tải lịch làm việc bác sĩ...
                  </div>
                )}

                {!scheduleLoading && doctorSchedules.length > 0 && (
                  <div className="md:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Ca làm việc:{" "}
                    {doctorSchedules
                      .map(
                        (schedule) =>
                          `${formatTime(schedule.StartTime)} - ${formatTime(
                            schedule.EndTime
                          )}`
                      )
                      .join(", ")}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Lý do khám
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => handleChange("reason", e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ví dụ: Đau đầu, sốt nhẹ..."
                  />
                </div>
              </div>

              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-3">
                {formError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    slotChecking ||
                    doctorLoading ||
                    roomLoading ||
                    scheduleLoading ||
                    !form.patientId ||
                    !form.doctorId ||
                    !form.roomId ||
                    Boolean(formValidationError)
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  Tạo lịch hẹn
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Hủy lịch hẹn
                </h2>
                <p className="text-sm text-slate-500">
                  {cancelDialog.appointment.PatientName} -{" "}
                  {formatTime(cancelDialog.appointment.AppointmentTime)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCancelDialog}
                className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Lý do hủy
                </label>
                <textarea
                  value={cancelDialog.reason}
                  onChange={(e) =>
                    setCancelDialog((prev) =>
                      prev ? { ...prev, reason: e.target.value } : prev
                    )
                  }
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Nhập lý do hủy lịch hẹn..."
                />
              </div>
            </div>

            <div className="border-t border-slate-100 bg-white px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCancelDialog}
                className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={
                  actionLoadingId === cancelDialog.appointment.AppointmentId
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoadingId === cancelDialog.appointment.AppointmentId ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                Hủy lịch hẹn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
