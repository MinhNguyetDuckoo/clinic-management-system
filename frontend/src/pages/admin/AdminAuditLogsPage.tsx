import { useState, useEffect } from "react";
import { Search } from "lucide-react";

import axiosClient from "../../api/axiosClient";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosClient.get("/admin/audit-logs")
      .then((res) => {
        const contentType = String(res.headers["content-type"] || "");
        if (!contentType?.includes("application/json")) {
          throw new Error("API did not return JSON. Please check backend API.");
        }
        if (res.data.success) {
          setLogs(res.data.data);
        } else {
          setError(res.data.message || "Failed to load audit logs");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "An error occurred");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Lịch sử thao tác hệ thống (100 logs gần nhất)</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm log..."
            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Thời gian</th>
                <th className="p-4 font-medium">User ID</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Table</th>
                <th className="p-4 font-medium">Record ID</th>
                <th className="p-4 font-medium">Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.AuditLogId} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4 text-slate-600 whitespace-nowrap">
                    {new Date(log.CreatedAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{log.UserId}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                      {log.Action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{log.TableName}</td>
                  <td className="p-4 text-slate-600">{log.RecordId}</td>
                  <td className="p-4">
                    <div className="max-w-xs truncate text-sm" title={log.NewData}>
                      <span className="text-emerald-600">{log.NewData}</span>
                      {log.OldData && <span className="text-amber-600 line-through block">{log.OldData}</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
