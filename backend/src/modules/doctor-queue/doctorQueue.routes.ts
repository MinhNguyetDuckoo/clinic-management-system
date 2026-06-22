import { Router } from "express";
import * as doctorQueueController from "./doctorQueue.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/doctors/:doctorId/today-queue",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  doctorQueueController.getDoctorTodayQueue
);

router.post(
  "/examinations/start",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  doctorQueueController.startExamination
);

router.post(
  "/examinations/:examinationId/diagnosis",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  doctorQueueController.saveDiagnosis
);

router.post(
  "/examinations/:examinationId/finish",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor"]),
  doctorQueueController.finishExamination
);

export default router;
