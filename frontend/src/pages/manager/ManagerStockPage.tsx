import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { AlertCircle, PackageSearch, Pill } from "lucide-react";

type DashboardSummary = {
  lowStockMedicines: number;
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

export default function ManagerStockPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stocks, setStocks] = useState<MedicineStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  async function loadData() {
    try {
      setLoading(true);
      const [sumRes, stockRes] = await Promise.all([
        axiosClient.get("/manager/dashboard-summary"),
        axiosClient.get("/manager/medicine-stock-status")
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (stockRes.data.success) setStocks(stockRes.data.data || []);
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getStockStatusStyle(status: string, stock: number) {
    if (stock === 0) return "bg-red-50 text-red-700 border-red-200";
    if (status === 'Low Stock') return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-green-50 text-green-700 border-green-200";
  }

  function getStockStatusText(status: string, stock: number) {
    if (stock === 0) return "Hết hàng";
    if (status === 'Low Stock') return "Sắp hết";
    return "Còn hàng";
  }

  const outOfStockCount = stocks.filter(s => s.StockQuantity === 0).length;
  
  const filteredStocks = stocks.filter(s => {
    if (filter === "All") return true;
    if (filter === "Out") return s.StockQuantity === 0;
    if (filter === "Low") return s.StockQuantity > 0 && s.StockStatus === 'Low Stock';
    if (filter === "Ok") return s.StockStatus === 'Normal';
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold">Tồn kho thuốc</h1>
          <p className="text-sm text-gray-500">
            Quản lý và cảnh báo tình trạng thuốc trong kho
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 disabled:opacity-50"
        >
          {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <PackageSearch size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tổng danh mục thuốc</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stocks.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Thuốc sắp hết</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {summary?.lowStockMedicines || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Pill size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Thuốc hết hàng</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {outOfStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* Tồn kho chi tiết */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">Chi tiết tồn kho</h2>
            <p className="text-sm text-gray-500 mt-1">Danh sách thuốc và số lượng cụ thể</p>
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Ok">Còn hàng</option>
            <option value="Low">Sắp hết</option>
            <option value="Out">Hết hàng</option>
          </select>
        </div>
        
        <div className="p-0 overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="text-left px-6 py-4">Tên thuốc</th>
                <th className="text-left px-6 py-4">Nhóm</th>
                <th className="text-center px-6 py-4">Đơn vị</th>
                <th className="text-center px-6 py-4">Tồn kho</th>
                <th className="text-center px-6 py-4">Tối thiểu</th>
                <th className="text-center px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Không có thuốc nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => (
                  <tr key={item.MedicineId} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.MedicineName}</td>
                    <td className="px-6 py-4 text-gray-600">{item.CategoryName || '-'}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{item.Unit}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 text-base">{item.StockQuantity}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{item.MinStockQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${getStockStatusStyle(item.StockStatus, item.StockQuantity)}`}>
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
  );
}
