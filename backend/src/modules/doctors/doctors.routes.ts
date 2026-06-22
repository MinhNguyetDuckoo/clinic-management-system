import { Router } from "express";
import * as doctorController from "./doctors.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist", "Doctor", "Manager"]),
  doctorController.getActiveDoctors
);

router.get(
  "/:id/schedules",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist", "Doctor", "Manager"]),
  doctorController.getDoctorSchedules
);

router.get(
  "/:id/examinations",
  authMiddleware,
  roleMiddleware(["Admin", "Doctor", "Manager"]),
  doctorController.getDoctorExaminations
);

export default router;
