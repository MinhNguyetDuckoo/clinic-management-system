import { useState, useEffect } from "react";
import { Plus, Lock, Unlock, Trash2, Edit, CheckCircle, KeyRound } from "lucide-react";

import axiosClient from "../../api/axiosClient";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: "",
    passwordHash: "",
    fullName: "",
    email: "",
    phone: "",
    roleId: "",
  });

  const [roleFormId, setRoleFormId] = useState("");
  const [passwordForm, setPasswordForm] = useState({ passwordHash: "", confirmPasswordHash: "" });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axiosClient.get("/admin/users"),
        axiosClient.get("/admin/roles"),
      ]);

      const contentTypeUsers = String(usersRes.headers["content-type"] || "");
      if (!contentTypeUsers?.includes("application/json")) {
        throw new Error("API did not return JSON. Please check backend API.");
      }

      const usersData = usersRes.data;
      const rolesData = rolesRes.data;

      if (usersData.success) setUsers(usersData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post("/admin/users", formData);
      const data = res.data;
      if (data.success) {
        alert("Tạo tài khoản thành công");
        setShowCreateModal(false);
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "An error occurred");
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await axiosClient.put(`/admin/users/${selectedUser.UserId}/role`, { roleId: roleFormId });
      const data = res.data;
      if (data.success) {
        alert("Đổi quyền thành công");
        setShowRoleModal(false);
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "An error occurred");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!passwordForm.passwordHash.trim()) {
      alert("Mật khẩu mới không được rỗng");
      return;
    }
    if (passwordForm.passwordHash !== passwordForm.confirmPasswordHash) {
      alert("Xác nhận mật khẩu không khớp");
      return;
    }
    if (!confirm(`Bạn có chắc muốn reset mật khẩu cho ${selectedUser.Username}?`)) return;

    try {
      const res = await axiosClient.patch(`/admin/users/${selectedUser.UserId}/password`, {
        passwordHash: passwordForm.passwordHash
      });
      const data = res.data;
      if (data.success) {
        alert(data.message || "Reset mật khẩu thành công");
        setShowPasswordModal(false);
        setPasswordForm({ passwordHash: "", confirmPasswordHash: "" });
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "An error occurred");
    }
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.IsActive ? "khóa" : "mở khóa";
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      const res = await axiosClient.patch(`/admin/users/${user.UserId}/status`, { isActive: !user.IsActive });
      const data = res.data;
      if (data.success) {
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "An error occurred");
    }
  };

  const handleToggleDelete = async (user: any) => {
    const action = user.IsDeleted ? "khôi phục" : "tạm xóa";
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      const res = await axiosClient.patch(`/admin/users/${user.UserId}/soft-delete`, { isDeleted: !user.IsDeleted });
      const data = res.data;
      if (data.success) {
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="text-slate-500 mt-1">Tạo và quản lý phân quyền tài khoản</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-2xl font-medium hover:bg-sky-700 transition"
        >
          <Plus size={20} />
          Tạo tài khoản
        </button>
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
                <th className="p-4 font-medium">Username</th>
                <th className="p-4 font-medium">Họ tên</th>
                <th className="p-4 font-medium">Vai trò</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.UserId} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-800">{user.Username}</td>
                  <td className="p-4 text-slate-600">{user.FullName}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                      {user.RoleName || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.IsDeleted ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm">Đã xóa</span>
                    ) : user.IsActive ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm">Hoạt động</span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">Bị khóa</span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setRoleFormId(user.RoleId ? user.RoleId.split(',')[0] : "");
                        setShowRoleModal(true);
                      }}
                      className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition"
                      title="Đổi quyền"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`p-2 rounded-xl transition ${
                        user.IsActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={user.IsActive ? "Khóa tài khoản" : "Mở khóa"}
                    >
                      {user.IsActive ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setPasswordForm({ passwordHash: "", confirmPasswordHash: "" });
                        setShowPasswordModal(true);
                      }}
                      className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition"
                      title="Reset mật khẩu"
                    >
                      <KeyRound size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleDelete(user)}
                      className={`p-2 rounded-xl transition ${
                        user.IsDeleted ? "text-emerald-600 hover:bg-emerald-50" : "text-red-600 hover:bg-red-50"
                      }`}
                      title={user.IsDeleted ? "Khôi phục" : "Tạm xóa"}
                    >
                      {user.IsDeleted ? <CheckCircle size={18} /> : <Trash2 size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Tài Khoản */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Tạo tài khoản mới</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={formData.passwordHash}
                  onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò *</label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((r) => (
                    <option key={r.RoleId} value={r.RoleId}>
                      {r.RoleName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700"
                >
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Quyền */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4">Đổi vai trò</h2>
            <p className="text-sm text-slate-500 mb-4">
              Người dùng: <span className="font-bold text-slate-800">{selectedUser.Username}</span>
            </p>
            <form onSubmit={handleChangeRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò mới</label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={roleFormId}
                  onChange={(e) => setRoleFormId(e.target.value)}
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((r) => (
                    <option key={r.RoleId} value={r.RoleId}>
                      {r.RoleName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4">Reset mật khẩu</h2>
            <div className="text-sm text-slate-500 mb-4 space-y-1">
              <p>Username: <span className="font-bold text-slate-800">{selectedUser.Username}</span></p>
              <p>Họ tên: <span className="font-bold text-slate-800">{selectedUser.FullName || "-"}</span></p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới / PasswordHash mới</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={passwordForm.passwordHash}
                  onChange={(e) => setPasswordForm({ ...passwordForm, passwordHash: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={passwordForm.confirmPasswordHash}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPasswordHash: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

