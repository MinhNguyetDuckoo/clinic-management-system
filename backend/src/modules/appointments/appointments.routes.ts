import { Router } from "express";
import * as appointmentController from "./appointments.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.post(
  "/demo/phantom-create",
  authMiddleware,
  appointmentController.createAppointmentFast
);

router.get(
  "/demo/phantom-count",
  authMiddleware,
  appointmentController.countAppointmentsPhantom
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist", "Doctor", "Manager"]),
  appointmentController.getAppointmentsByDate
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist"]),
  appointmentController.createAppointment
);

router.post(
  "/:id/check-in",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist"]),
  appointmentController.checkInPatient
);

router.post(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist"]),
  appointmentController.cancelAppointment
);

export default router;