import { Router } from "express";
import * as demoController from "./demo.controller";

const router = Router();

router.post("/reset", demoController.resetDemoData);

// 1. Lost Update
router.post("/lost-update/a", demoController.lostUpdateA);
router.post("/lost-update/b", demoController.lostUpdateB);

// 2. Dirty Read
router.post("/dirty-read/update", demoController.dirtyReadUpdate);
router.get("/dirty-read/select", demoController.dirtyReadSelect);

// 3. Unrepeatable Read
router.get("/unrepeatable-read/select", demoController.unrepeatableReadSelect);
router.post("/unrepeatable-read/update", demoController.unrepeatableReadUpdate);

// 4. Phantom Read / Deadlock
router.post("/phantom-read/a", demoController.phantomReadA);
router.post("/phantom-read/b", demoController.phantomReadB);

export default router;
