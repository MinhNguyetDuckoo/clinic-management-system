import { useState, useEffect } from "react";
import { Users, ShieldAlert, CheckCircle, Database, FileText } from "lucide-react";
import StatCard from "../../components/StatCard";

import axiosClient from "../../api/axiosClient";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosClient.get("/admin/dashboard-summary")
      .then((res) => {
        const contentType = String(res.headers["content-type"] || "");
        if (!contentType?.includes("application/json")) {
          throw new Error("API did not return JSON. Please check backend API.");
        }
        if (res.data.success) {
          setSummary(res.data.data);
        } else {
          setError(res.data.message || "Failed to load dashboard summary");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "An error occurred");
      });
  }, []);

  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-3xl">{error}</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Quản Trị</h1>
          <p className="text-slate-500 mt-1">Tổng quan hệ thống và tài nguyên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={summary.totalUsers}
          icon={Users}
          description={`${summary.activeUsers} đang hoạt động`}
        />
        <StatCard
          title="Tài khoản bị khóa"
          value={summary.lockedUsers}
          icon={ShieldAlert}
          description={`${summary.deletedUsers} đã tạm xóa`}
        />
        <StatCard
          title="Tổng bệnh nhân"
          value={summary.totalPatients}
          icon={CheckCircle}
          description={`Và ${summary.totalDoctors} bác sĩ`}
        />
        <StatCard
          title="Lượt đăng nhập hôm nay"
          value={summary.todayLogins}
          icon={FileText}
          description={`${summary.totalAuditLogs} logs hệ thống`}
        />
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-sky-600" />
          <h2 className="text-lg font-bold">Tài nguyên Database</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500">Tables</p>
            <p className="text-xl font-bold text-slate-800">{summary.totalTables}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500">Views</p>
            <p className="text-xl font-bold text-slate-800">{summary.totalViews}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500">Stored Procs</p>
            <p className="text-xl font-bold text-slate-800">{summary.totalStoredProcedures}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500">Functions</p>
            <p className="text-xl font-bold text-slate-800">{summary.totalFunctions}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-sm text-slate-500">Triggers</p>
            <p className="text-xl font-bold text-slate-800">{summary.totalTriggers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
