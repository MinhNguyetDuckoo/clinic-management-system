import { ClipboardList, FileText, Stethoscope, Activity } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function DoctorDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Bác sĩ</h1>
        <p className="mt-2 text-slate-500">
          Theo dõi hàng chờ, khám bệnh, chẩn đoán và kê đơn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Hàng chờ" value="Today" icon={ClipboardList} />
        <StatCard title="Khám bệnh" value="InProgress" icon={Stethoscope} />
        <StatCard title="Chẩn đoán" value="Lưu SP" icon={FileText} />
        <StatCard title="Dịch vụ" value="Orders" icon={Activity} />
      </div>
    </div>
  );
}