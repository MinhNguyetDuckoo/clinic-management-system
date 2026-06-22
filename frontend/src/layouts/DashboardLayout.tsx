import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Pill,
  Stethoscope,
  Users,
  BarChart3,
  Shield,
  CalendarClock
} from "lucide-react";
import { clearAuth, getUser } from "../utils/authStorage";

const roleMenus: Record<string, any[]> = {
  Admin: [
    { label: "Dashboard", path: "/admin", icon: Home },
    { label: "Người dùng", path: "/admin/users", icon: Shield },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: FileText },
    { label: "Database", path: "/admin/database", icon: BarChart3 },
    { label: "Bệnh nhân", path: "/admin/patients", icon: Users }
  ],
  Receptionist: [
    { label: "Dashboard", path: "/receptionist", icon: Home },
    { label: "Bệnh nhân", path: "/receptionist/patients", icon: Users },
    { label: "Lịch hẹn", path: "/receptionist/appointments", icon: CalendarDays }
  ],
  Doctor: [
    { label: "Dashboard", path: "/doctor", icon: Home },
    { label: "Hàng chờ khám", path: "/doctor/queue", icon: ClipboardList },
    { label: "Phiếu khám", path: "/doctor/examinations", icon: Stethoscope }
  ],
  Pharmacist: [
    { label: "Dashboard", path: "/pharmacist", icon: Home },
    { label: "Đơn thuốc", path: "/pharmacist/prescriptions", icon: Pill },
    { label: "Tồn kho", path: "/pharmacist/inventory", icon: FileText }
  ],
  Cashier: [
    { label: "Dashboard", path: "/cashier", icon: Home },
    { label: "Hóa đơn", path: "/cashier/invoices", icon: CreditCard }
  ],
  Manager: [
    { label: "Dashboard", path: "/manager/dashboard", icon: Home },
    { label: "Doanh thu", path: "/manager/revenue", icon: BarChart3 },
    { label: "Tồn kho", path: "/manager/inventory", icon: Pill },
    { label: "Lich bac si", path: "/manager/doctor-schedules", icon: CalendarClock },
    { label: "Quan ly thuoc", path: "/manager/medicines", icon: Pill }
  ]
};

export default function DashboardLayout() {
  const user = getUser();
  const roleRaw = user?.roles?.[0] || "Admin";
  // Normalize role keys for lookup
  const normalizedMenus = Object.fromEntries(
    Object.entries(roleMenus).map(([k, v]) => [k.toLowerCase(), v])
  );
  const menus = normalizedMenus[roleRaw.toLowerCase()] || roleMenus.Admin;
  const role = roleRaw; // For display

  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 hidden lg:flex flex-col bg-white border-r border-slate-100">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="h-11 w-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">ClinicCare</h1>
            <p className="text-xs text-slate-500">Quản lý phòng khám</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menus.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                  active
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-800">{user?.fullName}</p>
            <p className="text-sm text-slate-500">{role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-red-50 text-red-600 py-3 font-medium hover:bg-red-100 transition"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1">
        <header className="h-20 bg-white border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Xin chào,</p>
            <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
          </div>

          <div className="px-4 py-2 rounded-full bg-sky-50 text-sky-700 text-sm font-semibold">
            {role}
          </div>
        </header>

        <div className="p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
