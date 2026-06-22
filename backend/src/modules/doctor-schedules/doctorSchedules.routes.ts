import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import * as controller from "./doctorSchedules.controller";

const router = Router();

router.use(authMiddleware, roleMiddleware(["Admin", "Manager"]));

router.get("/", controller.getSchedules);
router.post("/", controller.createSchedule);
router.put("/:id", controller.updateSchedule);
router.patch("/:id/status", controller.updateScheduleStatus);

export default router;
