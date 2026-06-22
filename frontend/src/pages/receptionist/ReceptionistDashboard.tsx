import { CalendarDays, UserPlus, Users, ClipboardCheck } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function ReceptionistDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Lễ tân</h1>
        <p className="mt-2 text-slate-500">
          Quản lý bệnh nhân, lịch hẹn và check-in khám bệnh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Bệnh nhân" value="Tra cứu" icon={Users} />
        <StatCard title="Tạo hồ sơ" value="Nhanh" icon={UserPlus} />
        <StatCard title="Lịch hẹn" value="Theo ngày" icon={CalendarDays} />
        <StatCard title="Check-in" value="Sẵn sàng" icon={ClipboardCheck} />
      </div>
    </div>
  );
}