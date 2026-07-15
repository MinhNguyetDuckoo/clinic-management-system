import { Router } from "express";
import * as medicineController from "./medicines.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor", "Pharmacist", "Manager"]),
  medicineController.getMedicines
);

router.get(
  "/categories",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Pharmacist"]),
  medicineController.getCategories
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  medicineController.createMedicine
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  medicineController.updateMedicine
);

router.post(
  "/:id/stock-adjustment",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  medicineController.adjustStock
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Pharmacist"]),
  medicineController.updateMedicineStatus
);

router.post(
  "/demo/swap-stock",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Pharmacist"]),
  medicineController.swapMedicineStock
);

router.post(
  "/demo/swap-stock-fixed",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Pharmacist"]),
  medicineController.swapMedicineStockFixed
);

export default router;
