import { ClipboardList, PackageSearch, Pill, ShieldCheck } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function PharmacistDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Dược sĩ</h1>
        <p className="mt-2 text-slate-500">
          Quản lý đơn thuốc chờ cấp và tồn kho thuốc.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Đơn chờ cấp" value="Pending" icon={ClipboardList} />
        <StatCard title="Cấp thuốc" value="An toàn" icon={Pill} />
        <StatCard title="Tồn kho" value="Theo dõi" icon={PackageSearch} />
        <StatCard title="Locking" value="UPDLOCK" icon={ShieldCheck} />
      </div>
    </div>
  );
}