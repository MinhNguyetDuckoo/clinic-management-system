import { adminRepository } from "./admin.repository";
import { AppError } from "../../utils/AppError";

export class AdminService {
  async getDashboardSummary() {
    return adminRepository.getDashboardSummary();
  }

  async getUsers() {
    return adminRepository.getUsers();
  }

  async getPatients(filters: { status?: string; keyword?: string; limit?: number }) {
    return adminRepository.getPatients(filters);
  }

  async getPatientDetail(patientId: number) {
    if (!patientId) throw new AppError("PatientId không hợp lệ.", 400);
    const detail = await adminRepository.getPatientDetail(patientId);
    if (!detail) throw new AppError("Không tìm thấy bệnh nhân.", 404);
    return detail;
  }

  async getRoles() {
    return adminRepository.getRoles();
  }

  async createUser(userData: any, adminId: number) {
    if (!userData.username) throw new AppError("Username là bắt buộc.", 400);
    if (!userData.passwordHash) throw new AppError("Password là bắt buộc.", 400);
    if (!userData.roleId) throw new AppError("Role là bắt buộc.", 400);
    
    // Check if role exists
    const roleId = Number(userData.roleId);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      throw new AppError("Role khÃ´ng há»£p lá»‡.", 400);
    }

    const roles = await adminRepository.getRoles();
    const roleExists = roles.some((r: any) => Number(r.RoleId) === roleId);
    if (!roleExists) throw new AppError("Role không tồn tại.", 400);

    try {
      return await adminRepository.createUser({ ...userData, roleId }, adminId);
    } catch (err: any) {
      if (err.number === 50001) {
        throw new AppError("Tên đăng nhập đã tồn tại.", 400);
      } else if (err.number === 50002) {
        throw new AppError("Email đã tồn tại.", 400);
      }
      throw err;
    }
  }

  async changeRole(userId: number, roleId: number, adminId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError("UserId khÃ´ng há»£p lá»‡.", 400);
    }
    if (!Number.isInteger(roleId) || roleId <= 0) {
      throw new AppError("Role khÃ´ng há»£p lá»‡.", 400);
    }
    if (userId === adminId) {
      throw new AppError("Không thể tự đổi role của chính mình.", 403);
    }
    return adminRepository.changeRole(userId, roleId, adminId);
  }

  async resetUserPassword(userId: number, passwordHash: string, adminId: number) {
    if (!userId) throw new AppError("UserId không hợp lệ.", 400);
    if (!passwordHash?.trim()) throw new AppError("Mật khẩu mới không được rỗng.", 400);
    if (userId === adminId) throw new AppError("Không thể tự reset mật khẩu của chính mình.", 403);
    return adminRepository.resetUserPassword(userId, passwordHash.trim(), adminId);
  }

  async updateUserStatus(userId: number, isActive: boolean, adminId: number) {
    if (userId === adminId) {
      throw new AppError("Không thể tự khóa tài khoản của chính mình.", 403);
    }
    return adminRepository.updateUserStatus(userId, isActive, adminId);
  }

  async softDeleteUser(userId: number, isDeleted: boolean, adminId: number) {
    if (userId === adminId) {
      throw new AppError("Không thể tự xóa tài khoản của chính mình.", 403);
    }
    return adminRepository.softDeleteUser(userId, isDeleted, adminId);
  }

  async getLoginHistories() {
    return adminRepository.getLoginHistories();
  }

  async getAuditLogs(limit?: number) {
    return adminRepository.getAuditLogs(limit);
  }

  async getDatabaseObjects() {
    return adminRepository.getDatabaseObjects();
  }
}

export const adminService = new AdminService();
