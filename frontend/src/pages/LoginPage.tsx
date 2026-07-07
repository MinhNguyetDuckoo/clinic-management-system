import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Lock, User, Stethoscope, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      
      {/* Soft medical theme floating background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-sky-200/40 rounded-full blur-[100px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[900px] h-[900px] bg-emerald-200/30 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] left-[30%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[80px] animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-10 border border-white animate-fade-in">
        
        {/* LEFT PANEL */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-sky-50 to-blue-50/50 text-slate-800 overflow-hidden border-r border-slate-100/50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-multiply"></div>
          
          <div className="z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-4 ring-white">
                <Stethoscope size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ClinicCare</h1>
                <p className="text-sm text-sky-600 font-bold uppercase tracking-widest mt-1">Chuẩn mực y tế</p>
              </div>
            </div>

            <div className="mt-20">
              <h2 className="text-4xl font-bold leading-tight text-slate-900">
                Chăm sóc sức khỏe <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-emerald-500">tận tâm & hiện đại</span>
              </h2>
              <p className="mt-6 text-slate-600 leading-relaxed text-lg">
                Hệ thống quản lý phòng khám toàn diện, tối ưu hóa trải nghiệm thăm khám cho bệnh nhân và nâng cao hiệu suất làm việc của y bác sĩ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center z-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="rounded-2xl bg-white/60 backdrop-blur-md p-5 border border-white hover:bg-white transition-all duration-300 shadow-sm group">
              <p className="text-3xl font-extrabold text-sky-600 group-hover:scale-110 transition-transform">6</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Phân quyền</p>
            </div>
            <div className="rounded-2xl bg-white/60 backdrop-blur-md p-5 border border-white hover:bg-white transition-all duration-300 shadow-sm group">
              <p className="text-3xl font-extrabold text-emerald-500 group-hover:scale-110 transition-transform">SQL</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Bảo mật</p>
            </div>
            <div className="rounded-2xl bg-white/60 backdrop-blur-md p-5 border border-white hover:bg-white transition-all duration-300 shadow-sm group">
              <p className="text-3xl font-extrabold text-blue-500 group-hover:scale-110 transition-transform">24/7</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">Sẵn sàng</p>
            </div>
          </div>

          <Activity className="absolute right-[-10%] bottom-[-5%] text-sky-100" size={300} strokeWidth={1} />
        </div>

        {/* RIGHT PANEL */}
        <div className="relative p-10 sm:p-14 flex flex-col justify-center min-h-[600px] overflow-hidden bg-white/80 backdrop-blur-xl">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-2 ring-white">
              <Stethoscope size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ClinicCare</h1>
              <p className="text-xs text-sky-600 uppercase tracking-wider font-bold mt-0.5">Y tế cao cấp</p>
            </div>
          </div>

          <div className="z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Đăng nhập hệ thống
            </h2>
            <p className="mt-2 text-slate-500 font-medium">
              Vui lòng nhập thông tin tài khoản của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6 z-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block group-focus-within:text-sky-600 transition-colors">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-sm placeholder-slate-400 hover:bg-white"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
            </div>

            <div className="group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block group-focus-within:text-sky-600 transition-colors">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-sm placeholder-slate-400 hover:bg-white"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-4 shadow-[0_8px_20px_rgba(14,165,233,0.2)] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(14,165,233,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Đang xác thực...
                </span>
              ) : "Đăng nhập an toàn"}
            </button>
          </form>

          <div className="mt-10 z-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-4 mb-6 opacity-60">
              <div className="h-px bg-slate-200 flex-1"></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tài khoản trải nghiệm</p>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { role: "Quản trị", user: "admin", color: "hover:border-sky-300 hover:bg-sky-50 text-sky-700 bg-white" },
                { role: "Lễ tân", user: "letan", color: "hover:border-blue-300 hover:bg-blue-50 text-blue-700 bg-white" },
                { role: "Bác sĩ", user: "bacsi", color: "hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 bg-white" },
                { role: "Dược sĩ", user: "duocsi", color: "hover:border-purple-300 hover:bg-purple-50 text-purple-700 bg-white" },
                { role: "Thu ngân", user: "thungan", color: "hover:border-orange-300 hover:bg-orange-50 text-orange-700 bg-white" },
                { role: "Quản lý", user: "quanly", color: "hover:border-rose-300 hover:bg-rose-50 text-rose-700 bg-white" }
              ].map(btn => (
                <button
                  key={btn.role}
                  type="button"
                  onClick={() => {
                    setUsername(btn.user);
                    setPassword("demo_hash_123");
                    setError("");
                  }}
                  className={`px-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-md ${btn.color}`}
                >
                  <span className="opacity-80 text-[10px] uppercase tracking-widest font-bold">{btn.role}</span>
                  <span className="font-extrabold text-xs">{btn.user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}