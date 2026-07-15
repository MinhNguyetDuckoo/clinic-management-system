import { Router } from "express";
import * as reportController from "./reports.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/revenue",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportController.getRevenueByDay
);

router.get(
  "/revenue-dirty",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  reportController.getRevenueByDayDirty
);

router.get(
  "/medicine-stock",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Pharmacist"]),
  reportController.getMedicineStockStatus
);

export default router;