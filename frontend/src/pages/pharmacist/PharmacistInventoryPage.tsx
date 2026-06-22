import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

type Medicine = {
  MedicineId: number;
  MedicineName: string;
  Unit: string;
  Price: number;
  StockQuantity: number;
  MinStockQuantity: number;
  IsActive: boolean;
};

export default function PharmacistInventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadInventory() {
    try {
      setLoading(true);
      const response = await axiosClient.get("/medicines");
      if (response.data.success) {
        setMedicines(response.data.data || []);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi lấy danh sách tồn kho");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  function getStatusInfo(stock: number, minStock: number) {
    if (stock === 0) {
      return { text: "Hết hàng", className: "bg-red-50 text-red-700" };
    }
    if (stock <= minStock) {
      return { text: "Sắp hết", className: "bg-orange-50 text-orange-700" };
    }
    return { text: "Còn hàng", className: "bg-green-50 text-green-700" };
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Tồn kho thuốc</h1>
        <p className="text-sm text-gray-500">
          Danh sách thuốc hiện có và số lượng tồn kho
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Danh sách tồn kho</h2>
            <p className="text-sm text-gray-500">Tổng cộng {medicines.length} loại thuốc</p>
          </div>
          <button 
            onClick={loadInventory}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 bg-blue-50 rounded-lg"
          >
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-500">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3">Mã thuốc</th>
                  <th className="text-left px-5 py-3">Tên thuốc</th>
                  <th className="text-left px-5 py-3">Đơn vị</th>
                  <th className="text-right px-5 py-3">Giá (VNĐ)</th>
                  <th className="text-right px-5 py-3">Tồn kho</th>
                  <th className="text-right px-5 py-3">Tồn tối thiểu</th>
                  <th className="text-center px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-gray-500">
                      Không có dữ liệu tồn kho
                    </td>
                  </tr>
                ) : (
                  medicines.map((item) => {
                    const status = getStatusInfo(item.StockQuantity, item.MinStockQuantity);
                    return (
                      <tr key={item.MedicineId} className="border-t">
                        <td className="px-5 py-4 font-medium">#{item.MedicineId}</td>
                        <td className="px-5 py-4 font-medium">{item.MedicineName}</td>
                        <td className="px-5 py-4">{item.Unit}</td>
                        <td className="px-5 py-4 text-right">{item.Price?.toLocaleString()}</td>
                        <td className="px-5 py-4 text-right font-medium">{item.StockQuantity}</td>
                        <td className="px-5 py-4 text-right text-gray-500">{item.MinStockQuantity}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
