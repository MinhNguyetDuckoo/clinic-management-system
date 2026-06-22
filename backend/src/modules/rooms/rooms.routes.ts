import { Router } from "express";
import * as roomController from "./rooms.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Receptionist", "Doctor", "Manager"]),
  roomController.getActiveRooms
);

export default router;
