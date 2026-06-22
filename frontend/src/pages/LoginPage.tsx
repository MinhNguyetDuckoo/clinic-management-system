import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Lock, User, Stethoscope } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { saveAuth } from "../utils/authStorage";

function getRedirectPath(roles: string[]) {
  if (roles.includes("Admin")) return "/admin";
  if (roles.includes("Receptionist")) return "/receptionist";
  if (roles.includes("Doctor")) return "/doctor";
  if (roles.includes("Pharmacist")) return "/pharmacist";
  if (roles.includes("Cashier")) return "/cashier";
  if (roles.includes("Manager")) return "/manager";
  if (roles.includes("Patient")) return "/patient";

  return "/login";
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosClient.post("/auth/login", {
        username,
        password
      });

      const { token, user } = response.data.data;

      saveAuth(token, user);

      navigate(getRedirectPath(user.roles));
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background generic floating blobs for overall page depth */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-sky-300/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] bg-emerald-300/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-10 border border-white/50">
        
        {/* LEFT PANEL */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-sky-600 to-emerald-500 text-white overflow-hidden">
          {/* Subtle overlay texture or pattern could go here */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="z-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                <Stethoscope size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">ClinicCare</h1>
                <p className="text-sm text-sky-50 opacity-90">Quản lý phòng khám</p>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-4xl font-bold leading-tight">
                Hệ thống quản lý phòng khám đa khoa
              </h2>
              <p className="mt-5 text-sky-50 leading-7 font-medium opacity-90">
                Database-first với Stored Procedures, Views, Triggers và Audit Logs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center z-10">
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 border border-white/10">
              <p className="text-2xl font-bold">6</p>
              <p className="text-xs text-sky-50 uppercase tracking-wider font-semibold mt-1">Vai trò</p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 border border-white/10">
              <p className="text-2xl font-bold">SQL</p>
              <p className="text-xs text-sky-50 uppercase tracking-wider font-semibold mt-1">DB First</p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 border border-white/10">
              <p className="text-2xl font-bold">SP</p>
              <p className="text-xs text-sky-50 uppercase tracking-wider font-semibold mt-1">Procedures</p>
            </div>
          </div>

          <Activity className="absolute right-8 bottom-32 opacity-10" size={160} />
          
          {/* Decorative gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
        </div>

        {/* RIGHT PANEL */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-center min-h-[600px] overflow-hidden bg-white">
          
          {/* Enhanced Glow Blobs for right panel */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-400/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '5s' }}></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '7s' }}></div>
          <div className="absolute top-[40%] left-[50%] w-72 h-72 bg-indigo-400/15 rounded-full blur-[70px] pointer-events-none animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }}></div>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">ClinicCare</h1>
              <p className="text-sm text-slate-500">Quản lý phòng khám</p>
            </div>
          </div>

          <div className="z-10">
            <p className="text-sm font-bold text-sky-600 uppercase tracking-wider">Chào mừng trở lại</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
              Đăng nhập hệ thống
            </h2>
            <p className="mt-3 text-slate-500 font-medium">
              Nhập tài khoản để truy cập giao diện theo vai trò.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 z-10">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Tên đăng nhập
              </label>
              <div className="mt-2 relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition shadow-sm hover:border-sky-300 focus:border-sky-500"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Mật khẩu
              </label>
              <div className="mt-2 relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition shadow-sm hover:border-sky-300 focus:border-sky-500"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 disabled:opacity-60 text-white font-bold py-3.5 shadow-lg shadow-sky-200 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập an toàn"}
            </button>
          </form>

          <div className="mt-8 z-10">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px bg-slate-200 flex-1"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đăng nhập nhanh (Demo)</p>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { role: "Quản trị", user: "admin", color: "bg-slate-100/80 hover:bg-slate-100 text-slate-800" },
                { role: "Lễ tân", user: "letan", color: "bg-blue-100/70 hover:bg-blue-100 text-blue-800" },
                { role: "Bác sĩ", user: "bacsi", color: "bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800" },
                { role: "Dược sĩ", user: "duocsi", color: "bg-purple-100/70 hover:bg-purple-100 text-purple-800" },
                { role: "Thu ngân", user: "thungan", color: "bg-orange-100/70 hover:bg-orange-100 text-orange-800" },
                { role: "Quản lý", user: "quanly", color: "bg-rose-100/70 hover:bg-rose-100 text-rose-800" }
              ].map(btn => (
                <button
                  key={btn.role}
                  type="button"
                  onClick={() => {
                    setUsername(btn.user);
                    setPassword("demo_hash_123");
                    setError("");
                  }}
                  className={`px-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-white/40 shadow-sm backdrop-blur-md hover:-translate-y-1 hover:shadow-lg ${btn.color}`}
                >
                  <span className="opacity-80 text-[11px] uppercase tracking-wide font-bold">{btn.role}</span>
                  <span className="font-bold text-[13px]">{btn.user}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini info strip at bottom */}
          <div className="mt-auto pt-8 z-10 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Đa vai trò</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Database First</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>SQL Server</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Audit Logs</span>
          </div>

        </div>
      </div>
    </div>
  );
}