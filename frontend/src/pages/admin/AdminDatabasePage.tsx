import { useState, useEffect } from "react";
import { Table, Code, Activity, Link2, List, ShieldCheck, RefreshCw } from "lucide-react";

import axiosClient from "../../api/axiosClient";

export default function AdminDatabasePage() {
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadObjects = () => {
    setLoading(true);
    setError(null);
    axiosClient.get("/admin/database-objects")
      .then((res) => {
        const contentType = String(res.headers["content-type"] || "");
        if (!contentType?.includes("application/json")) {
          throw new Error("API did not return JSON. Please check backend API.");
        }
        if (res.data.success) {
          setObjects(res.data.data);
        } else {
          setError(res.data.message || "Failed to load database objects");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "An error occurred");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadObjects();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "Tables": return <Table className="text-sky-600" size={24} />;
      case "Stored Procedures":
      case "Functions": return <Code className="text-emerald-600" size={24} />;
      case "Triggers": return <Activity className="text-amber-600" size={24} />;
      case "Foreign Keys": return <Link2 className="text-indigo-600" size={24} />;
      case "Indexes": return <List className="text-purple-600" size={24} />;
      default: return <ShieldCheck className="text-slate-600" size={24} />;
    }
  };

  const getDescription = (type: string) => {
    switch (type) {
      case "Tables": return "Lưu trữ dữ liệu cốt lõi của hệ thống.";
      case "Views": return "Gom nhóm và truy vấn dữ liệu phức tạp cho Dashboard.";
      case "Stored Procedures": return "Xử lý logic nghiệp vụ an toàn tại Database.";
      case "Functions": return "Hàm tính toán và xử lý dữ liệu.";
      case "Triggers": return "Tự động ghi Audit Log và bảo vệ dữ liệu.";
      case "Foreign Keys": return "Chống dữ liệu mồ côi, đảm bảo toàn vẹn tham chiếu.";
      case "Indexes": return "Tối ưu hóa tốc độ truy vấn.";
      case "Check Constraints": return "Kiểm soát dữ liệu hợp lệ (VD: Số tiền >= 0).";
      case "Default Constraints": return "Cung cấp giá trị mặc định cho cột.";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo Tài nguyên Database</h1>
          <p className="text-slate-500 mt-1">Thống kê các đối tượng đang có trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={loadObjects}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {error && (
          <div className="col-span-full p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl">
            {error}
          </div>
        )}
        {objects.map((obj) => (
          <div key={obj.ObjectType} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl shrink-0">
              {getIcon(obj.ObjectType)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{obj.ObjectType}</h3>
              <p className="text-3xl font-black text-slate-800 mt-1">{obj.Total}</p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {getDescription(obj.ObjectType)}
              </p>
            </div>
          </div>
        ))}
        {objects.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-slate-500">
            Không thể tải dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}
