import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import patientRoutes from "./modules/patients/patients.routes";
import appointmentRoutes from "./modules/appointments/appointments.routes";
import examinationRoutes from "./modules/examinations/examinations.routes";
import medicineRoutes from "./modules/medicines/medicines.routes";
import prescriptionRoutes from "./modules/prescriptions/prescriptions.routes";
import invoiceRoutes from "./modules/invoices/invoices.routes";
import reportRoutes from "./modules/reports/reports.routes";
import managerRoutes from "./modules/manager/manager.routes";
import doctorQueueRoutes from "./modules/doctor-queue/doctorQueue.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import doctorRoutes from "./modules/doctors/doctors.routes";
import roomRoutes from "./modules/rooms/rooms.routes";
import adminRoutes from "./modules/admin/admin.routes";
import doctorScheduleRoutes from "./modules/doctor-schedules/doctorSchedules.routes";
import demoRoutes from "./modules/demo/demo.routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.json({
    message: "Clinic Management API is running"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api", doctorQueueRoutes);
app.use("/api/examinations", examinationRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor-schedules", doctorScheduleRoutes);
app.use("/api/demo", demoRoutes);
app.use(errorMiddleware);
export default app;
