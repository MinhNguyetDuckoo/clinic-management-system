import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { AppError } from "../../utils/AppError";

export class AdminController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await adminService.getDashboardSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await adminService.getUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const patients = await adminService.getPatients({
        status: req.query.status as string | undefined,
        keyword: req.query.keyword as string | undefined,
        limit
      });
      res.json({ success: true, data: patients });
    } catch (error) {
      next(error);
    }
  }

  async getPatientDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = parseInt(req.params.id as string, 10);
      const detail = await adminService.getPatientDetail(patientId);
      res.json({ success: true, data: detail });
    } catch (error) {
      next(error);
    }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await adminService.getRoles();
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user.userId;
      const user = await adminService.createUser(req.body, adminId);
      res.status(201).json({ success: true, data: user, message: "Tạo tài khoản thành công." });
    } catch (error) {
      next(error);
    }
  }

  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id as string, 10);
      const roleId = Number(req.body.roleId);
      const adminId = (req as any).user.userId;

      if (!roleId) throw new AppError("roleId là bắt buộc.", 400);
      
      await adminService.changeRole(userId, roleId, adminId);
      res.json({ success: true, message: "Đổi role thành công." });
    } catch (error) {
      next(error);
    }
  }

  async resetUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id as string, 10);
      const adminId = (req as any).user.userId;
      const passwordHash = req.body.passwordHash || req.body.password;

      await adminService.resetUserPassword(userId, passwordHash, adminId);
      res.json({ success: true, message: "Reset mật khẩu thành công." });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id as string, 10);
      const { isActive } = req.body;
      const adminId = (req as any).user.userId;

      if (typeof isActive !== "boolean") throw new AppError("isActive phải là boolean.", 400);
      
      await adminService.updateUserStatus(userId, isActive, adminId);
      res.json({ success: true, message: isActive ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản." });
    } catch (error) {
      next(error);
    }
  }

  async softDeleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id as string, 10);
      const { isDeleted } = req.body;
      const adminId = (req as any).user.userId;

      if (typeof isDeleted !== "boolean") throw new AppError("isDeleted phải là boolean.", 400);

      await adminService.softDeleteUser(userId, isDeleted, adminId);
      res.json({ success: true, message: isDeleted ? "Đã tạm xóa tài khoản." : "Đã khôi phục tài khoản." });
    } catch (error) {
      next(error);
    }
  }

  async getLoginHistories(req: Request, res: Response, next: NextFunction) {
    try {
      const histories = await adminService.getLoginHistories();
      res.json({ success: true, data: histories });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await adminService.getAuditLogs(limit);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  async getDatabaseObjects(req: Request, res: Response, next: NextFunction) {
    try {
      const objects = await adminService.getDatabaseObjects();
      res.json({ success: true, data: objects });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
