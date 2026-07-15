import { Router } from "express";
import * as invoiceController from "./invoices.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", invoiceController.getInvoices);
router.get("/unpaid", invoiceController.getUnpaidInvoices);
router.get("/ready-examinations", invoiceController.getReadyForInvoiceExaminations);
router.get("/:id", invoiceController.getInvoiceDetail);
router.post("/from-examination", invoiceController.createInvoiceFromExamination);
router.post("/demo/create-sample", invoiceController.createSampleInvoice);
router.post("/:id/pay", invoiceController.payInvoice);
router.post("/:id/cancel", invoiceController.cancelInvoice);
router.post(
  "/:id/pay-error",
  authMiddleware,
  roleMiddleware(["Admin", "Cashier"]),
  invoiceController.payInvoiceError
);

export default router;
