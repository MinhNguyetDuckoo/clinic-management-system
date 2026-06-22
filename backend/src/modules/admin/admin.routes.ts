import { Router } from "express";
import { adminController } from "./admin.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

// Tất cả các route trong admin đều phải đăng nhập và có role admin
router.use(authMiddleware);
router.use(roleMiddleware(["Admin"]));

router.get("/dashboard-summary", adminController.getDashboardSummary);
router.get("/users", adminController.getUsers);
router.get("/patients", adminController.getPatients);
router.get("/patients/:id", adminController.getPatientDetail);
router.get("/roles", adminController.getRoles);
router.post("/users", adminController.createUser);
router.put("/users/:id/role", adminController.changeRole);
router.patch("/users/:id/password", adminController.resetUserPassword);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.patch("/users/:id/soft-delete", adminController.softDeleteUser);
router.get("/login-histories", adminController.getLoginHistories);
router.get("/audit-logs", adminController.getAuditLogs);
router.get("/database-objects", adminController.getDatabaseObjects);

export default router;
