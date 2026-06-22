import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";
import AdminDatabasePage from "../pages/admin/AdminDatabasePage";
import AdminPatientsPage from "../pages/admin/AdminPatientsPage";
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorQueuePage from "../pages/doctor/DoctorQueuePage";
import DoctorExaminationsPage from "../pages/doctor/DoctorExaminationsPage";
import PharmacistDashboard from "../pages/pharmacist/PharmacistDashboard";
import PharmacistPrescriptionsPage from "../pages/pharmacist/PharmacistPrescriptionsPage";
import PharmacistInventoryPage from "../pages/pharmacist/PharmacistInventoryPage";
import CashierDashboard from "../pages/cashier/CashierDashboard";
import CashierInvoicesPage from "../pages/cashier/CashierInvoicesPage";
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import ManagerRevenuePage from "../pages/manager/ManagerRevenuePage";
import ManagerStockPage from "../pages/manager/ManagerStockPage";
import DoctorSchedulesPage from "../pages/manager/DoctorSchedulesPage";
import MedicineManagementPage from "../pages/manager/MedicineManagementPage";
import PatientsPage from "../pages/receptionist/PatientsPage";
import AppointmentsPage from "../pages/receptionist/AppointmentsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="patients" element={<AdminPatientsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="database" element={<AdminDatabasePage />} />
      </Route>

      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={["Receptionist"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReceptionistDashboard />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["Doctor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="queue" element={<DoctorQueuePage />} />
        <Route path="examinations" element={<DoctorExaminationsPage />} />
      </Route>

      <Route
        path="/pharmacist"
        element={
          <ProtectedRoute allowedRoles={["Pharmacist"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PharmacistDashboard />} />
        <Route path="prescriptions" element={<PharmacistPrescriptionsPage />} />
        <Route path="inventory" element={<PharmacistInventoryPage />} />
      </Route>

      <Route
        path="/cashier"
        element={
          <ProtectedRoute allowedRoles={["Cashier"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CashierDashboard />} />
        <Route path="invoices" element={<CashierInvoicesPage />} />
      </Route>

      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboardPage />} />
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="revenue" element={<ManagerRevenuePage />} />
        <Route path="stock" element={<ManagerStockPage />} />
        <Route path="inventory" element={<ManagerStockPage />} />
        <Route path="doctor-schedules" element={<DoctorSchedulesPage />} />
        <Route path="medicines" element={<MedicineManagementPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
