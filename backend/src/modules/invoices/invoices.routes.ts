import { Router } from "express";
import * as invoiceController from "./invoices.controller";

const router = Router();

router.get("/", invoiceController.getInvoices);
router.get("/unpaid", invoiceController.getUnpaidInvoices);
router.get("/ready-examinations", invoiceController.getReadyForInvoiceExaminations);
router.get("/:id", invoiceController.getInvoiceDetail);
router.post("/from-examination", invoiceController.createInvoiceFromExamination);
router.post("/:id/pay", invoiceController.payInvoice);
router.post("/:id/cancel", invoiceController.cancelInvoice);

export default router;
