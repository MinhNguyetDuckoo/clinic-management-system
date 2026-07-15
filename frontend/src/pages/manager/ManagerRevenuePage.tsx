import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { Banknote, FileCheck, FileWarning } from "lucide-react";

type DashboardSummary = {
  todayRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
};

type RevenueByDay = {
  RevenueDate: string;
  TotalPaidInvoices: number;
  TotalRevenue: number;
};

export default function ManagerRevenuePage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenues, setRevenues] = useState<RevenueByDay[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [sumRes, revRes] = await Promise.all([
        axiosClient.get("/manager/dashboard-summary"),
        axiosClient.get("/manager/revenue-by-day")
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (revRes.data.success) setRevenues(revRes.data.data || []);
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi tải dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  }

  async function loadDataDirty() {
    try {
      setLoading(true);
      // ONLY fetch dirty revenue, do NOT fetch dashboard-summary because it doesn't have READ UNCOMMITTED and will block
      const revRes = await axiosClient.get("/reports/revenue-dirty");

      if (revRes.data.success) {
        const revData = revRes.data.data || [];
        setRevenues(revData);
        // Update todayRevenue manually from dirty read data so the card also updates
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRow = revData.find((r: any) => r.RevenueDate && r.RevenueDate.startsWith(todayStr));
        if (todayRow) {
          setSummary((prev: any) => ({ ...prev, todayRevenue: todayRow.TotalRevenue }));
        }
      }
      alert("Đã tải báo cáo với READ UNCOMMITTED (Dirty Read)");
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi tải dữ liệu doanh thu (Dirty Read)");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold">Doanh thu phòng khám</h1>
          <p className="text-sm text-gray-500">
            Chi tiết doanh thu và trạng thái thanh toán hóa đơn
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDataDirty}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            Tải báo cáo (Dirty Read)
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Doanh thu hôm nay</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary?.todayRevenue?.toLocaleString() || 0} ₫
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hóa đơn đã thanh toán</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary?.paidInvoices || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <FileWarning size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hóa đơn chờ thanh toán</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary?.unpaidInvoices || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Doanh thu theo ngày */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b bg-gray-50/50">
          <h2 className="font-semibold text-lg">Lịch sử doanh thu theo ngày</h2>
          <p className="text-sm text-gray-500 mt-1">Báo cáo doanh thu chi tiết các ngày qua</p>
        </div>
        <div className="p-0 overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="text-left px-6 py-4">Ngày</th>
                <th className="text-center px-6 py-4">Số hóa đơn (Đã thanh toán)</th>
                <th className="text-right px-6 py-4">Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {revenues.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Chưa có dữ liệu doanh thu
                  </td>
                </tr>
              ) : (
                revenues.map((item, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-700">{formatDate(item.RevenueDate)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                        {item.TotalPaidInvoices}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-700 text-base">
                      {item.TotalRevenue?.toLocaleString()} ₫
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
