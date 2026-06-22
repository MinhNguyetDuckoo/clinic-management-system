import { Router } from "express";
import * as patientController from "./patients.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist", "Doctor", "Manager"]),
  patientController.searchPatients
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist", "Doctor", "Manager", "Patient"]),
  patientController.getPatientById
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist"]),
  patientController.createPatient
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist"]),
  patientController.updatePatient
);

export default router;