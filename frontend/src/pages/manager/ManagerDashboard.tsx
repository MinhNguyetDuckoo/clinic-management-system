import { BarChart3, LineChart, PackageSearch, TrendingUp } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function ManagerDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Quản lý</h1>
        <p className="mt-2 text-slate-500">
          Theo dõi doanh thu, tồn kho và tình hình hoạt động phòng khám.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Doanh thu" value="Theo ngày" icon={TrendingUp} />
        <StatCard title="Báo cáo" value="View SQL" icon={BarChart3} />
        <StatCard title="Tồn kho" value="Stock" icon={PackageSearch} />
        <StatCard title="Phân tích" value="Dashboard" icon={LineChart} />
      </div>
    </div>
  );
}