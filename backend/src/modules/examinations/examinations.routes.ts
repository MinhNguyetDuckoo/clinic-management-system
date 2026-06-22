import { Router } from "express";
import * as examinationController from "./examinations.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor", "Receptionist", "Manager"]),
  examinationController.getExaminationDetail
);

router.post(
  "/:id/start",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  examinationController.startExamination
);

router.put(
  "/:id/diagnosis",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  examinationController.saveDiagnosis
);

router.post(
  "/:id/service-orders",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  examinationController.createServiceOrder
);

router.post(
  "/service-orders/:id/complete",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  examinationController.completeServiceOrder
);

router.post(
  "/:id/finish",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  examinationController.finishExamination
);

export default router;