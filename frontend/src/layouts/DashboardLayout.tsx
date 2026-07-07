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
    <div className="min-h-screen bg-slate-50/80 flex font-sans overflow-hidden">
      {/* Soft medical background gradient */}
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-sky-50/60 to-transparent pointer-events-none -z-10"></div>
      
      <aside className="w-72 hidden lg:flex flex-col bg-white border-r border-slate-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.015)] z-20 transition-all duration-300">
        <div className="h-24 px-8 flex items-center gap-4 border-b border-slate-100/80 shrink-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/20">
            <Stethoscope size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-800">ClinicCare</h1>
            <p className="text-[11px] font-bold text-sky-600 uppercase tracking-widest mt-0.5">Y tế cao cấp</p>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
          <div className="mb-4 mt-2 px-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menu chính</p>
          </div>
          {menus.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                  active
                    ? "bg-sky-50 text-sky-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <div className={`${active ? "text-sky-600" : "text-slate-400 group-hover:text-sky-500 group-hover:scale-110"} transition-all duration-300`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                {item.label}
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100/80 shrink-0 bg-slate-50/30">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/50 shadow-sm mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg ring-1 ring-emerald-200/50">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm text-slate-800 truncate">{user?.fullName}</p>
              <p className="text-xs font-medium text-slate-500 truncate">{role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-rose-200 text-rose-600 py-3 text-sm font-bold shadow-sm hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        <header className="h-24 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="animate-fade-in">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Xin chào,</p>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{user?.fullName}</h2>
          </div>

          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100/50 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {role}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
