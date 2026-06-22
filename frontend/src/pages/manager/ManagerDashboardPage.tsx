import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  Banknote,
  CalendarDays,
  FileCheck,
  FileWarning,
  Pill,
  Users
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

type DashboardSummary = {
  todayRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  todayAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  pendingPrescriptions: number;
  lowStockMedicines: number;
};

type RevenueByDay = {
  RevenueDate: string;
  TotalPaidInvoices: number;
  TotalRevenue: number;
};

type MedicineStock = {
  MedicineId: number;
  MedicineName: string;
  Unit: string;
  StockQuantity: number;
  MinStockQuantity: number;
  Price: number;
  CategoryName: string;
  StockStatus: string;
};

export default function ManagerDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenues, setRevenues] = useState<RevenueByDay[]>([]);
  const [stocks, setStocks] = useState<MedicineStock[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [sumRes, revRes, stockRes] = await Promise.all([
        axiosClient.get("/manager/dashboard-summary"),
        axiosClient.get("/manager/revenue-by-day"),
        axiosClient.get("/manager/medicine-stock-status")
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (revRes.data.success) setRevenues(revRes.data.data || []);
      if (stockRes.data.success) setStocks(stockRes.data.data || []);
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
  }

  function getStockStatusStyle(status: string) {
    if (status === 'Low Stock' || status === 'Out of Stock') {
      return "bg-red-50 text-red-700";
    }
    return "bg-green-50 text-green-700";
  }

  function getStockStatusText(status: string, stock: number) {
    if (stock === 0) return "Hết hàng";
    if (status === 'Low Stock') return "Sắp hết";
    return "Còn hàng";
  }

  // Chart data processing
  const revenueChartData = [...revenues].reverse().map(r => ({
    name: formatDate(r.RevenueDate),
    revenue: r.TotalRevenue
  }));

  const stockChartData = [...stocks].sort((a, b) => a.StockQuantity - b.StockQuantity).slice(0, 8).map(s => ({
    name: s.MedicineName.length > 15 ? s.MedicineName.substring(0, 15) + '...' : s.MedicineName,
    fullName: s.MedicineName,
    stock: s.StockQuantity,
    min: s.MinStockQuantity,
    fill: s.StockQuantity === 0 ? '#ef4444' : s.StockQuantity <= s.MinStockQuantity ? '#f97316' : '#22c55e'
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quan phòng khám</h1>
          <p className="text-sm text-gray-500">
            Xem báo cáo doanh thu và hoạt động mới nhất
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 disabled:opacity-50 transition"
        >
          {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </button>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <Banknote size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Doanh thu hôm nay</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {summary?.todayRevenue?.toLocaleString() || 0} ₫
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Lịch hẹn hôm nay</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {summary?.todayAppointments || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hóa đơn đã thanh toán</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {summary?.paidInvoices || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <FileWarning size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hóa đơn chờ TT</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {summary?.unpaidInvoices || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng bệnh nhân</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {summary?.totalPatients || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Pill size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Thuốc sắp hết</p>
            <p className="text-xl font-bold text-red-600 mt-1">
              {summary?.lowStockMedicines || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col">
          <h2 className="font-semibold text-lg">Biểu đồ doanh thu 14 ngày gần nhất</h2>
          <div className="h-[280px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={70} tickFormatter={(value) => `${(value/1000).toLocaleString()}k`} />
                <Tooltip 
                  formatter={(value) => [`${Number(value || 0).toLocaleString()} ₫`, 'Doanh thu']}
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col">
          <h2 className="font-semibold text-lg">Thuốc có tồn kho thấp nhất</h2>
          <div className="h-[280px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData} layout="vertical" margin={{top: 5, right: 30, left: 10, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={120} />
                <Tooltip 
                  formatter={(value) => [`${Number(value || 0)} đơn vị`, 'Tồn kho']}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="stock" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {stockChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doanh thu theo ngày */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b bg-gray-50/50">
            <h2 className="font-semibold">Chi tiết doanh thu gần đây</h2>
          </div>
          <div className="p-0 overflow-auto flex-1 max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-3">Ngày</th>
                  <th className="text-center px-5 py-3">Số hóa đơn (Paid)</th>
                  <th className="text-right px-5 py-3">Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {revenues.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-gray-500">
                      Chưa có dữ liệu doanh thu
                    </td>
                  </tr>
                ) : (
                  revenues.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 font-medium">{formatDate(item.RevenueDate)}</td>
                      <td className="px-5 py-3 text-center">{item.TotalPaidInvoices}</td>
                      <td className="px-5 py-3 text-right font-medium text-blue-700">
                        {item.TotalRevenue?.toLocaleString()} ₫
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tồn kho thuốc */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-semibold">Tình trạng tồn kho</h2>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" title="Hết hàng"></span>
              <span className="w-3 h-3 rounded-full bg-orange-400" title="Sắp hết"></span>
              <span className="w-3 h-3 rounded-full bg-green-500" title="Còn hàng"></span>
            </div>
          </div>
          <div className="p-0 overflow-auto flex-1 max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-3">Thuốc</th>
                  <th className="text-center px-5 py-3">Tồn</th>
                  <th className="text-center px-5 py-3">Tối thiểu</th>
                  <th className="text-center px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                      Không có dữ liệu tồn kho
                    </td>
                  </tr>
                ) : (
                  stocks.slice(0, 5).map((item) => (
                    <tr key={item.MedicineId} className="border-t hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3">
                        <p className="font-medium">{item.MedicineName}</p>
                        <p className="text-xs text-gray-500">{item.Unit}</p>
                      </td>
                      <td className="px-5 py-3 text-center font-medium">{item.StockQuantity}</td>
                      <td className="px-5 py-3 text-center text-gray-500">{item.MinStockQuantity}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStockStatusStyle(item.StockStatus)}`}>
                          {getStockStatusText(item.StockStatus, item.StockQuantity)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

