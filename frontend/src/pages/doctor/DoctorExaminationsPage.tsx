import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getUser } from "../../utils/authStorage";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";

type Doctor = {
  DoctorId: number;
  UserId: number;
  DoctorName: string;
  SpecialtyName: string;
};

type Examination = {
  ExaminationId: number;
  AppointmentDate: string;
  AppointmentTime: string;
  PatientCode: string;
  PatientName: string;
  RoomName?: string | null;
  Reason?: string | null;
  ExaminationStatus: string;
  Symptoms?: string | null;
  Diagnosis?: string | null;
  Conclusion?: string | null;
};

type DoctorSchedule = {
  ScheduleId: number;
  RoomId: number | null;
  RoomName: string | null;
  WorkDate: string;
  StartTime: string;
  EndTime: string;
  MaxPatients: number;
};

function todayString() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().substring(0, 10);
}

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
}

function statusLabel(status?: string) {
  switch (status) {
    case "Waiting":
      return "Đang chờ khám";
    case "InProgress":
      return "Đang khám";
    case "Completed":
      return "Hoàn tất";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status || "-";
  }
}

export default function DoctorExaminationsPage() {
  const [date, setDate] = useState(todayString());
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function resolveDoctorId() {
    const user = getUser();

    if (!user?.userId) {
      throw new Error("Không tìm thấy thông tin đăng nhập bác sĩ.");
    }

    const response = await axiosClient.get("/doctors");
    const doctors: Doctor[] = response.data.data || [];
    const currentDoctor = doctors.find(
      (doctor) => Number(doctor.UserId) === Number(user.userId)
    );

    if (!currentDoctor?.DoctorId) {
      throw new Error("Tài khoản hiện tại chưa liên kết với hồ sơ bác sĩ.");
    }

    setDoctorId(currentDoctor.DoctorId);
    return currentDoctor.DoctorId;
  }

  async function loadExaminations(targetDoctorId = doctorId, targetDate = date) {
    setLoading(true);
    setError("");

    try {
      const resolvedDoctorId = targetDoctorId ?? (await resolveDoctorId());
      const [examinationResponse, scheduleResponse] = await Promise.all([
        axiosClient.get(`/doctors/${resolvedDoctorId}/examinations`, {
          params: {
            date: targetDate
          }
        }),
        axiosClient.get(`/doctors/${resolvedDoctorId}/schedules`, {
          params: {
            date: targetDate
          }
        })
      ]);

      setDoctorId(resolvedDoctorId);
      setExaminations(examinationResponse.data.data || []);
      setSchedules(scheduleResponse.data.data || []);
    } catch (err: any) {
      setExaminations([]);
      setSchedules([]);
      setError(err.response?.data?.message || err.message || "Không thể tải phiếu khám.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    resolveDoctorId().then((resolvedDoctorId) => {
      loadExaminations(resolvedDoctorId, date);
    }).catch((err) => {
      setError(err.message || "Không thể tải phiếu khám.");
    });
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Phiếu khám</h1>
          <p className="mt-2 text-sm text-gray-500">
            Danh sách phiếu khám theo ngày của bác sĩ đang đăng nhập.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => loadExaminations()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Tải lại
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Lich lam viec</h2>
            <p className="text-sm text-gray-500">
              Ca lam cua ban trong ngay {formatDate(date)}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            <CalendarDays size={14} />
            {schedules.length} ca
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-4 text-sm text-gray-500">
            Dang tai lich lam viec...
          </div>
        ) : schedules.length === 0 ? (
          <div className="px-5 py-6 text-sm text-gray-500">
            Khong co lich lam viec trong ngay nay.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.ScheduleId}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                    <Clock size={16} />
                    {formatTime(schedule.StartTime)} - {formatTime(schedule.EndTime)}
                  </div>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Dang hoat dong
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-sky-600" />
                    <span>{displayValue(schedule.RoomName)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-sky-600" />
                    <span>Toi da {schedule.MaxPatients} benh nhan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Danh sách phiếu khám</h2>
          <p className="text-sm text-gray-500">Tổng cộng {examinations.length} phiếu</p>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Giờ</th>
                <th className="px-5 py-3 text-left">Bệnh nhân</th>
                <th className="px-5 py-3 text-left">Phòng</th>
                <th className="px-5 py-3 text-left">Triệu chứng</th>
                <th className="px-5 py-3 text-left">Chẩn đoán</th>
                <th className="px-5 py-3 text-left">Kết luận</th>
                <th className="px-5 py-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {examinations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    Chưa có phiếu khám nào trong ngày này.
                  </td>
                </tr>
              ) : (
                examinations.map((item) => (
                  <tr key={item.ExaminationId} className="border-t">
                    <td className="px-5 py-4 font-medium">{item.AppointmentTime?.slice(0, 5)}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium">{item.PatientName}</div>
                      <div className="text-xs text-gray-500">{item.PatientCode}</div>
                    </td>
                    <td className="px-5 py-4">{displayValue(item.RoomName)}</td>
                    <td className="px-5 py-4">{displayValue(item.Symptoms)}</td>
                    <td className="px-5 py-4">{displayValue(item.Diagnosis)}</td>
                    <td className="px-5 py-4">{displayValue(item.Conclusion)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                        {statusLabel(item.ExaminationStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
