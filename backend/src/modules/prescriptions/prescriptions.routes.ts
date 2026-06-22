import { Router } from "express";
import * as prescriptionController from "./prescriptions.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  prescriptionController.createPrescription
);

router.post(
  "/:id/details",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  prescriptionController.addPrescriptionDetail
);

router.delete(
  "/details/:detailId",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  prescriptionController.deletePrescriptionDetail
);

router.get(
  "/pending",
  authMiddleware,
  roleMiddleware(["Admin", "Pharmacist"]),
  prescriptionController.getPendingPrescriptions
);

router.get(
  "/examination/:examinationId",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor", "Pharmacist"]),
  prescriptionController.getPrescriptionByExaminationId
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor", "Pharmacist"]),
  prescriptionController.getPrescriptionDetail
);

router.post(
  "/:id/dispense",
  authMiddleware,
  roleMiddleware(["Admin", "Pharmacist"]),
  prescriptionController.dispenseMedicine
);

export default router;
