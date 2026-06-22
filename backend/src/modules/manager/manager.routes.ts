import { Router } from "express";
import * as managerController from "./manager.controller";

const router = Router();

router.get("/dashboard-summary", managerController.getDashboardSummary);
router.get("/revenue-by-day", managerController.getRevenueByDay);
router.get("/medicine-stock-status", managerController.getMedicineStockStatus);

export default router;
