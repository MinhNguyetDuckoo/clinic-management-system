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

router.post(
  "/demo/create-sample",
  authMiddleware,
  prescriptionController.createSampleData
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

router.post(
  "/:id/dispense-delay",
  authMiddleware,
  roleMiddleware(["Admin", "Pharmacist"]),
  prescriptionController.dispenseMedicineDelay
);

router.post(
  "/:id/dispense-lost-update",
  authMiddleware,
  roleMiddleware(["Admin", "Pharmacist"]),
  prescriptionController.dispenseMedicineLostUpdate
);

export default router;
