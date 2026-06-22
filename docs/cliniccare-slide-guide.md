# Hướng Dẫn Làm Slide Thuyết Trình ClinicCare

Nguồn đã đọc trong project:
- Database scripts: `database/02_tables`, `03_indexes`, `04_views`, `05_functions`, `06_procedures`, `07_triggers`, `09_tests`, `10_concurrency`.
- Backend: `backend/src/app.ts`, `backend/src/config/database.ts`, các repository gọi stored procedure, `backend/src/tools/concurrency-test.ts`.
- Frontend: `frontend/src/routes/AppRoutes.tsx`, các page theo role.
- Ảnh có sẵn: `erd-corrected.png`, `erd-diagram.png`, `backend-routing.png`.

Số liệu thật đã query từ SQL Server, đã lọc bỏ bảng lab `__CC_Test_*` và object diagram của SSMS:

| Nhóm object | Số lượng |
|---|---:|
| Business tables | 25 |
| Views | 8 |
| Stored procedures nghiệp vụ | 38 |
| Functions nghiệp vụ | 8 |
| Triggers | 13 |
| Foreign keys | 35 |
| Check constraints | 16 |
| Default constraints | 48 |
| Indexes trên bảng nghiệp vụ | 50 |

> Nếu máy bạn query ra khác, dùng SQL ở slide 5 để lấy số liệu mới nhất.

---

## PHẦN 1. GIỚI THIỆU NGẮN VỀ HỆ THỐNG

### Slide 1 - ClinicManagementDB / ClinicCare

**Nội dung trên slide**
- ClinicManagementDB / ClinicCare
- Hệ thống quản lý phòng khám
- Định hướng Database-first
- Database không chỉ lưu dữ liệu, mà còn kiểm soát nghiệp vụ

**Lời thoại**
“Nhóm em xây dựng ClinicCare, một hệ thống quản lý phòng khám. Điểm chính của dự án là hướng database-first: backend và frontend có vai trò giao tiếp, còn nhiều rule quan trọng như tạo lịch, khám bệnh, cấp thuốc, thanh toán, chống trùng dữ liệu được đặt trực tiếp trong SQL Server.”

**Ảnh minh họa**
- Trang login hoặc dashboard tổng quan.
- Logo ClinicCare nếu có.

**Query SQL**
Không cần.

### Slide 2 - Dự Án Giải Quyết Bài Toán Gì

**Nội dung trên slide**
- Quản lý bệnh nhân
- Lễ tân tạo lịch hẹn, check-in
- Bác sĩ khám bệnh và kê đơn
- Dược sĩ cấp thuốc
- Thu ngân tạo hóa đơn, thanh toán
- Manager quản lý lịch bác sĩ, kho thuốc, doanh thu
- Admin quản trị user, audit log, database

**Lời thoại**
“Luồng chính của hệ thống bắt đầu từ bệnh nhân và lịch hẹn. Lễ tân tạo lịch, bác sĩ khám và kê đơn, dược sĩ cấp thuốc, thu ngân thanh toán. Manager quản lý lịch bác sĩ, kho thuốc và báo cáo doanh thu. Admin quản trị người dùng, phân quyền, audit log và xem thông tin database.”

**Ảnh minh họa**
- Chụp sidebar hoặc các màn hình theo role: Receptionist, Doctor, Pharmacist, Cashier, Manager, Admin.

**Query SQL**
```sql
SELECT RoleName, Description
FROM Roles
ORDER BY RoleId;
```

### Slide 3 - Công Nghệ Và Cấu Hình Tổng Quan

**Nội dung trên slide**
- Frontend: React + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: SQL Server
- Kết nối DB qua `backend/src/config/database.ts` và `.env`
- Backend gọi stored procedure bằng thư viện `mssql`

**Lời thoại**
“Frontend được viết bằng React TypeScript. Backend dùng Node.js, Express, TypeScript. Database là SQL Server. Backend đọc cấu hình database từ `.env` và `backend/src/config/database.ts`. Các repository dùng thư viện `mssql` để gọi stored procedure hoặc view.”

**Ảnh minh họa**
- Chụp `backend/src/config/database.ts`.
- Chụp `.env` nhưng che password nếu đưa lên slide.

**Query SQL**
Không cần.

### Slide 4 - Kiến Trúc Nhiều Lớp

**Nội dung trên slide**
Frontend -> Route/API -> Controller -> Service -> Repository -> Stored Procedure/View -> SQL Server

**Lời thoại**
“Kiến trúc của dự án đi theo nhiều lớp. Frontend gọi API. API đi qua route, controller, service, repository. Repository là nơi gọi stored procedure hoặc query view trong SQL Server. Như vậy backend không tự insert/update lung tung, mà các rule quan trọng được gom về database.”

**Ảnh minh họa**
- Chụp `backend/src/app.ts` để thấy các route `/api/...`.
- Chụp một repository, ví dụ `appointments.repository.ts` gọi `dbo.sp_CreateAppointment`.
- Chụp `backend-routing.png` nếu muốn minh họa luồng.

**Query SQL**
Không cần.

---

## PHẦN 2. DATABASE CỦA DỰ ÁN CÓ GÌ

### Slide 5 - Tổng Quan Object Trong Database

**Nội dung trên slide**
- 25 business tables
- 8 views
- 38 stored procedures nghiệp vụ
- 8 functions nghiệp vụ
- 13 triggers
- 35 foreign keys
- 16 check constraints
- 48 default constraints
- 50 indexes trên bảng nghiệp vụ

**Lời thoại**
“Đây là số lượng object chính trong database sau khi lọc bỏ bảng lab concurrency và object diagram của SSMS. Con số này cho thấy database của dự án không chỉ có table, mà còn có view, stored procedure, function, trigger, constraint và index để kiểm soát nghiệp vụ.”

**Ảnh minh họa**
- Chụp kết quả query object count.
- Chụp Object Explorer trong SSMS/Azure Data Studio.

**Query SQL**
```sql
WITH business_tables AS (
  SELECT object_id, name
  FROM sys.tables
  WHERE is_ms_shipped = 0
    AND name <> 'sysdiagrams'
    AND name NOT LIKE '__CC_Test[_]%'
),
business_objects AS (
  SELECT object_id, name, type
  FROM sys.objects
  WHERE is_ms_shipped = 0
    AND name NOT IN (
      'sp_alterdiagram','sp_creatediagram','sp_dropdiagram',
      'sp_helpdiagramdefinition','sp_helpdiagrams','sp_renamediagram',
      'sp_upgraddiagrams','fn_diagramobjects'
    )
)
SELECT 'Business Tables' AS ObjectType, COUNT(*) AS Total FROM business_tables
UNION ALL SELECT 'Views', COUNT(*) FROM sys.views WHERE is_ms_shipped = 0
UNION ALL SELECT 'Stored Procedures', COUNT(*) FROM business_objects WHERE type = 'P'
UNION ALL SELECT 'Functions', COUNT(*) FROM business_objects WHERE type IN ('FN','IF','TF')
UNION ALL SELECT 'Triggers', COUNT(*) FROM sys.triggers WHERE is_ms_shipped = 0
UNION ALL SELECT 'Foreign Keys', COUNT(*) FROM sys.foreign_keys fk JOIN business_tables t ON fk.parent_object_id = t.object_id
UNION ALL SELECT 'Check Constraints', COUNT(*) FROM sys.check_constraints cc JOIN business_tables t ON cc.parent_object_id = t.object_id
UNION ALL SELECT 'Default Constraints', COUNT(*) FROM sys.default_constraints dc JOIN business_tables t ON dc.parent_object_id = t.object_id
UNION ALL SELECT 'Indexes', COUNT(*) FROM sys.indexes i JOIN business_tables t ON i.object_id = t.object_id
WHERE i.type > 0 AND i.is_hypothetical = 0;
```

### Slide 6 - Các Nhóm Bảng Chính

**Nội dung trên slide**
- Auth: `Users`, `Roles`, `UserRoles`, `LoginHistories`
- Nhân sự & bệnh nhân: `Employees`, `Doctors`, `Specialties`, `Patients`, `MedicalRecords`
- Lịch hẹn: `Rooms`, `DoctorSchedules`, `AppointmentStatuses`, `Appointments`
- Khám bệnh: `Examinations`, `Services`, `ServiceOrders`
- Thuốc: `MedicineCategories`, `Medicines`, `Prescriptions`, `PrescriptionDetails`, `InventoryTransactions`
- Hóa đơn & audit: `Invoices`, `InvoiceDetails`, `Payments`, `AuditLogs`

**Lời thoại**
“Các bảng được chia theo nghiệp vụ phòng khám. Nhóm auth quản lý tài khoản và phân quyền. Nhóm bệnh nhân, bác sĩ lưu hồ sơ. Nhóm lịch hẹn quản lý phòng, ca làm việc và appointment. Nhóm khám bệnh nối appointment sang examination. Nhóm thuốc xử lý đơn thuốc và tồn kho. Nhóm hóa đơn lưu invoice, payment và audit log.”

**Ảnh minh họa**
- Chụp cây table trong database.
- Hoặc tạo slide dạng 6 khối màu.

**Query SQL**
```sql
SELECT name AS TableName
FROM sys.tables
WHERE is_ms_shipped = 0
  AND name <> 'sysdiagrams'
  AND name NOT LIKE '__CC_Test[_]%'
ORDER BY name;
```

### Slide 7 - ERD Và Quan Hệ Chính

**Nội dung trên slide**
- `Appointments` nối `Patients`, `Doctors`, `Rooms`
- `DoctorSchedules` quy định bác sĩ làm phòng nào, ngày nào, giờ nào
- `Examinations` sinh từ `Appointment`
- `Prescriptions` sinh từ `Examination`
- `PrescriptionDetails` nối thuốc với đơn thuốc
- `Payments` nối với `Invoices`
- `AuditLogs` lưu lịch sử thay đổi

**Lời thoại**
“ERD thể hiện luồng nghiệp vụ rất rõ. Một appointment thuộc về bệnh nhân, bác sĩ và phòng khám. Khi bệnh nhân được khám thì tạo examination. Từ examination có thể sinh prescription và invoice. PrescriptionDetails là bảng chi tiết thuốc. Payment gắn với invoice. AuditLogs dùng để lưu lịch sử thao tác.”

**Ảnh minh họa**
- Dùng `erd-corrected.png`.
- Nếu ảnh quá rộng, crop vùng Appointments -> Examinations -> Prescriptions -> Invoices.

**Query SQL**
Không cần.

---

## PHẦN 3. CONSTRAINTS BẢO VỆ DỮ LIỆU

### Slide 8 - Foreign Keys

**Nội dung trên slide**
- Database có 35 foreign keys
- Ví dụ:
  - `FK_Appointments_Patients`
  - `FK_Appointments_Doctors`
  - `FK_Appointments_Rooms`
  - `FK_PrescriptionDetails_Prescriptions`
  - `FK_PrescriptionDetails_Medicines`
  - `FK_Payments_Invoices`

**Lời thoại**
“Foreign key giúp chặn dữ liệu mồ côi. Ví dụ không thể tạo appointment trỏ tới bệnh nhân không tồn tại, không thể có prescription detail trỏ tới thuốc không tồn tại, và không thể có payment trỏ tới invoice không tồn tại. Đây là lớp bảo vệ nằm ngay trong database.”

**Ảnh minh họa**
- Chụp danh sách FK trong SSMS.
- Chụp query FK trả về các tên constraint.

**Query SQL**
```sql
SELECT
  fk.name AS ForeignKeyName,
  OBJECT_NAME(fk.parent_object_id) AS ChildTable,
  OBJECT_NAME(fk.referenced_object_id) AS ParentTable
FROM sys.foreign_keys fk
ORDER BY ChildTable, ForeignKeyName;
```

### Slide 9 - Check Constraints

**Nội dung trên slide**
- `CK_DoctorSchedules_Time`: `StartTime < EndTime`
- `CK_Medicines_Stock`: `StockQuantity >= 0`
- `CK_PrescriptionDetails_Quantity`: `Quantity > 0`
- `CK_Payments_Amount`: `Amount > 0`
- `CK_Appointments_Status`: status hợp lệ
- `CK_Prescriptions_Status`: `Pending`, `Dispensed`, `Cancelled`

**Lời thoại**
“Check constraint giúp database tự chặn dữ liệu sai. Nếu UI hoặc backend gửi status không hợp lệ, số lượng thuốc âm, payment bằng 0, database vẫn không cho lưu. Như vậy rule dữ liệu không phụ thuộc hoàn toàn vào frontend hoặc backend.”

**Ảnh minh họa**
- Chụp kết quả query check constraints.

**Query SQL**
```sql
SELECT
  OBJECT_NAME(parent_object_id) AS TableName,
  name AS CheckName,
  definition
FROM sys.check_constraints
ORDER BY TableName, name;
```

### Slide 10 - Default Constraints

**Nội dung trên slide**
- `Users.IsActive = 1`
- `Users.IsDeleted = 0`
- `Appointments.Status = 'Scheduled'`
- `Examinations.Status = 'Waiting'`
- `Prescriptions.Status = 'Pending'`
- `Invoices.Status = 'Unpaid'`
- `Medicines.StockQuantity = 0`
- `CreatedAt = SYSDATETIME()`

**Lời thoại**
“Default constraint giúp dữ liệu mới có trạng thái ban đầu đúng. Ví dụ appointment mặc định là Scheduled, examination mặc định Waiting, prescription mặc định Pending, invoice mặc định Unpaid. Điều này làm dữ liệu ổn định hơn kể cả khi backend không truyền đủ field.”

**Ảnh minh họa**
- Chụp query default constraints.

**Query SQL**
```sql
SELECT
  OBJECT_NAME(dc.parent_object_id) AS TableName,
  c.name AS ColumnName,
  dc.name AS DefaultName,
  dc.definition
FROM sys.default_constraints dc
JOIN sys.columns c
  ON c.object_id = dc.parent_object_id
 AND c.column_id = dc.parent_column_id
ORDER BY TableName, ColumnName;
```

---

## PHẦN 4. VIEWS TRONG DATABASE

### Slide 11 - Vì Sao Dùng View

**Nội dung trên slide**
- View gom dữ liệu từ nhiều bảng
- Backend/frontend đọc dễ hơn
- Mỗi role có view gần với màn hình của role đó
- Giảm query join lặp lại ở backend

**Lời thoại**
“Trong dự án, view không dùng để làm màu. View gom sẵn dữ liệu từ nhiều bảng cho từng màn hình. Ví dụ bác sĩ cần thấy patient, appointment, examination, room, medical record trong một danh sách. View giúp backend đọc đơn giản hơn.”

**Ảnh minh họa**
- Chụp folder `database/04_views`.
- Chụp view trong SSMS.

**Query SQL**
```sql
SELECT name AS ViewName
FROM sys.views
WHERE is_ms_shipped = 0
ORDER BY name;
```

### Slide 12 - Các View Theo Vai Trò

**Nội dung trên slide**
- `vw_Admin_UserList`: Admin xem user và role
- `vw_Receptionist_TodayAppointments`: Lễ tân xem lịch hẹn hôm nay
- `vw_Doctor_TodayQueue`: Bác sĩ xem hàng chờ khám
- `vw_Pharmacist_PendingPrescriptions`: Dược sĩ xem đơn chờ cấp
- `vw_PrescriptionDetails`: Xem chi tiết đơn thuốc
- `vw_Cashier_UnpaidInvoices`: Thu ngân xem hóa đơn chưa thanh toán
- `vw_Manager_RevenueByDay`: Manager xem doanh thu theo ngày
- `vw_Manager_MedicineStockStatus`: Manager xem trạng thái tồn kho

**Lời thoại**
“Mỗi view phục vụ một role cụ thể. Admin dùng view user list, receptionist dùng view appointment hôm nay, doctor dùng view queue, pharmacist dùng view pending prescription, cashier dùng view unpaid invoice, manager dùng view revenue và stock status.”

**Ảnh minh họa**
- Bảng 2 cột: View / Role.

**Query SQL**
```sql
SELECT name AS ViewName
FROM sys.views
WHERE name LIKE 'vw_%'
ORDER BY name;
```

### Slide 13 - Ví Dụ View Doctor / Pharmacist / Manager

**Nội dung trên slide**
- `vw_Doctor_TodayQueue`: bác sĩ xem bệnh nhân chờ khám
- `vw_Pharmacist_PendingPrescriptions`: dược sĩ xem đơn chờ cấp
- `vw_Manager_MedicineStockStatus`: manager xem thuốc Normal, LowStock, OutOfStock

**Lời thoại**
“Ba view này thể hiện rõ database hỗ trợ UI. Bác sĩ không cần tự join nhiều bảng để có hàng chờ khám. Dược sĩ có danh sách đơn đang Pending. Manager có trạng thái tồn kho được tính bằng CASE trong view.”

**Ảnh minh họa**
- Chụp kết quả `SELECT TOP 10` từ 2 hoặc 3 view.
- Chụp màn hình Doctor queue, Pharmacist prescriptions, Manager stock.

**Query SQL**
```sql
SELECT TOP 10 * FROM vw_Doctor_TodayQueue;
SELECT TOP 10 * FROM vw_Pharmacist_PendingPrescriptions;
SELECT TOP 10 * FROM vw_Manager_MedicineStockStatus;
```

---

## PHẦN 5. STORED PROCEDURES XỬ LÝ NGHIỆP VỤ

### Slide 14 - Vì Sao Dự Án Dùng Stored Procedure

**Nội dung trên slide**
- Gom nhiều bước nghiệp vụ vào database
- Có `BEGIN TRANSACTION`
- Có rollback khi lỗi
- Có lock để chống thao tác đồng thời
- Backend gọi SP thay vì tự update tùy ý

**Lời thoại**
“Dự án dùng stored procedure vì nhiều nghiệp vụ không phải một câu insert đơn giản. Ví dụ cấp thuốc phải kiểm tra đơn, lock thuốc, kiểm tra tồn kho, trừ kho, ghi InventoryTransactions và đổi status. Các bước này cần transaction để hoặc thành công hết, hoặc rollback hết.”

**Ảnh minh họa**
- Chụp một repository `.execute("dbo.sp_CreateAppointment")`.
- Chụp đoạn SP có `BEGIN TRANSACTION` và `THROW`.

**Query SQL**
```sql
SELECT name
FROM sys.procedures
WHERE is_ms_shipped = 0
  AND name NOT LIKE 'sp_%diagram%'
ORDER BY name;
```

### Slide 15 - Nhóm Stored Procedure Theo Nghiệp Vụ

**Nội dung trên slide**
- Auth: `sp_CreateUser`, `sp_AssignRole`, `sp_GetUserByUsername`
- Patient: `sp_CreatePatient`, `sp_UpdatePatient`, `sp_SearchPatients`
- Appointment: `sp_CreateAppointment`, `sp_CheckInPatient`, `sp_CancelAppointment`
- Examination: `sp_StartExamination`, `sp_SaveDiagnosis`, `sp_FinishExamination`
- Pharmacy: `sp_CreatePrescription`, `sp_AddPrescriptionDetail`, `sp_DispenseMedicine`
- Invoice: `sp_CreateInvoice`, `sp_PayInvoice`, `sp_CancelInvoice`
- Manager: `sp_CreateDoctorSchedule`, `sp_UpdateDoctorSchedule`, `sp_AdjustMedicineStock`

**Lời thoại**
“Stored procedure được chia theo module nghiệp vụ giống backend. Điều này giúp backend gọi đúng nhóm SP, còn database giữ rule chính của từng nghiệp vụ.”

**Ảnh minh họa**
- Chụp folder `database/06_procedures`.

**Query SQL**
```sql
SELECT name
FROM sys.procedures
WHERE name LIKE 'sp_%'
  AND name NOT LIKE 'sp_%diagram%'
ORDER BY name;
```

### Slide 16 - Ví Dụ `sp_CreateAppointment`

**Nội dung trên slide**
1. Kiểm tra bệnh nhân tồn tại
2. Kiểm tra bác sĩ active
3. Kiểm tra phòng active
4. Kiểm tra bác sĩ có lịch làm việc
5. Lấy phòng từ `DoctorSchedules`
6. Lock vùng lịch hẹn
7. Chặn trùng bác sĩ/ngày/giờ
8. Chặn trùng phòng/ngày/giờ
9. Insert appointment và ghi audit

**Lời thoại**
“`sp_CreateAppointment` xử lý trường hợp hai lễ tân cùng tạo lịch cho một bác sĩ cùng giờ. SP dùng `SERIALIZABLE`, `UPDLOCK`, `HOLDLOCK` để khóa vùng lịch hẹn. Ngoài ra còn có unique index `UX_Appointments_Doctor_Date_Time_Active` làm lớp bảo vệ cuối cùng.”

**Ảnh minh họa**
- Chụp đoạn SP ở `database/06_procedures/003_appointment_procedures.sql`.
- Chụp kết quả tool business: 1 request success, 1 request blocked.

**Query SQL**
```sql
EXEC sp_helptext 'dbo.sp_CreateAppointment';

SELECT COUNT(*) AS DuplicateGroups
FROM (
  SELECT DoctorId, AppointmentDate, AppointmentTime
  FROM Appointments
  WHERE Status NOT IN ('Cancelled','NoShow')
  GROUP BY DoctorId, AppointmentDate, AppointmentTime
  HAVING COUNT(*) > 1
) x;
```

### Slide 17 - Ví Dụ `sp_DispenseMedicine`

**Nội dung trên slide**
1. Kiểm tra đơn thuốc tồn tại
2. Kiểm tra trạng thái `Pending`
3. Lock đơn thuốc và thuốc
4. Kiểm tra tồn kho
5. Trừ `Medicines.StockQuantity`
6. Ghi `InventoryTransactions` type `OUT`
7. Cập nhật `Prescriptions.Status = 'Dispensed'`
8. Commit hoặc rollback

**Lời thoại**
“`sp_DispenseMedicine` là ví dụ rõ về chống lost update. Nếu hai dược sĩ cấp cùng một đơn, chỉ một người thành công. Người còn lại bị chặn vì đơn đã không còn Pending. Tồn kho chỉ bị trừ một lần và lịch sử xuất kho được ghi vào `InventoryTransactions`.”

**Ảnh minh họa**
- Chụp đoạn SP ở `005_prescription_pharmacy_procedures.sql`.
- Chụp output `[PASS] sp_DispenseMedicine` từ tool.

**Query SQL**
```sql
EXEC sp_helptext 'dbo.sp_DispenseMedicine';

SELECT TOP 10 *
FROM InventoryTransactions
WHERE TransactionType = 'OUT'
ORDER BY CreatedAt DESC;
```

### Slide 18 - Ví Dụ `sp_PayInvoice`

**Nội dung trên slide**
1. Kiểm tra hóa đơn tồn tại
2. Lock invoice bằng `UPDLOCK`, `HOLDLOCK`
3. Kiểm tra invoice còn `Unpaid`
4. Chặn thanh toán nếu đơn thuốc còn `Pending`
5. Kiểm tra amount và payment method
6. Insert `Payments`
7. Update `Invoices.Status = 'Paid'`
8. Ghi audit

**Lời thoại**
“`sp_PayInvoice` tránh thanh toán trùng hóa đơn. Khi một request đã lock và đổi invoice sang Paid, request còn lại sẽ bị chặn vì invoice không còn trạng thái Unpaid.”

**Ảnh minh họa**
- Chụp đoạn SP ở `006_invoice_payment_procedures.sql`.
- Chụp output tool business: payment count = 1.

**Query SQL**
```sql
EXEC sp_helptext 'dbo.sp_PayInvoice';

SELECT TOP 10 i.InvoiceId, i.Status, COUNT(p.PaymentId) AS PaymentCount
FROM Invoices i
LEFT JOIN Payments p ON p.InvoiceId = i.InvoiceId
GROUP BY i.InvoiceId, i.Status
ORDER BY i.InvoiceId DESC;
```

### Slide 19 - Ví Dụ Manager Stored Procedures

**Nội dung trên slide**
- `sp_CreateDoctorSchedule`: tạo lịch bác sĩ, check overlap
- `sp_UpdateDoctorSchedule`: sửa lịch, chặn sửa khi có appointment active
- `sp_SetDoctorScheduleStatus`: bật/tắt lịch
- `sp_AdjustMedicineStock`: nhập kho hoặc điều chỉnh kho
- Mọi biến động kho ghi `InventoryTransactions`

**Lời thoại**
“Ở phần manager, database kiểm soát lịch làm việc và kho thuốc. Lịch bác sĩ không được overlap. Nếu lịch đã có appointment active thì không được tắt hoặc sửa tùy tiện. Kho thuốc không update trực tiếp ở UI mà đi qua `sp_AdjustMedicineStock`, từ đó ghi lịch sử vào InventoryTransactions.”

**Ảnh minh họa**
- Chụp màn hình Manager DoctorSchedules.
- Chụp Manager Stock/Medicine management.

**Query SQL**
```sql
EXEC sp_helptext 'dbo.sp_CreateDoctorSchedule';
EXEC sp_helptext 'dbo.sp_AdjustMedicineStock';
```

---

## PHẦN 6. TRIGGERS, INDEXES, FUNCTIONS

### Slide 20 - Triggers

**Nội dung trên slide**
- Audit triggers:
  - `trg_Audit_Patients_Update`
  - `trg_Audit_Medicines_Update`
  - `trg_Audit_Invoices_Update`
  - `trg_Audit_Prescriptions_Update`
  - `trg_Audit_DoctorSchedules_Update`
- Protection triggers:
  - `trg_Prevent_Delete_DoctorSchedules`
  - `trg_Prevent_Delete_Medicines`
  - `trg_Prevent_Delete_Doctors`
  - `trg_Prevent_Delete_Appointments`
  - `trg_Prevent_Delete_Rooms`

**Lời thoại**
“Trigger trong dự án có hai nhóm. Nhóm audit ghi lại lịch sử update vào `AuditLogs`. Nhóm protection chặn xóa cứng các dữ liệu quan trọng như lịch hẹn, thuốc, bác sĩ, phòng khám, lịch làm việc. Ví dụ không được delete appointment, phải cập nhật trạng thái Cancelled.”

**Ảnh minh họa**
- Chụp `database/07_triggers`.
- Chụp trigger `trg_Prevent_Delete_Appointments`.

**Query SQL**
```sql
SELECT name AS TriggerName,
       OBJECT_NAME(parent_id) AS TableName,
       is_disabled
FROM sys.triggers
ORDER BY TriggerName;
```

### Slide 21 - Indexes

**Nội dung trên slide**
- `UX_Appointments_Doctor_Date_Time_Active`
- `IX_Appointments_Date_Doctor`
- `IX_Appointments_Patient`
- `IX_Medicines_Stock`
- `IX_Invoices_Status`
- `IX_Prescriptions_Status`
- `UX_Patients_UserId_NotNull`

**Lời thoại**
“Index giúp truy vấn nhanh hơn và có một index đặc biệt dùng để bảo vệ dữ liệu: `UX_Appointments_Doctor_Date_Time_Active`. Đây là unique filtered index chặn một bác sĩ có hai appointment active cùng ngày giờ. Filter bỏ qua trạng thái Cancelled và NoShow.”

**Ảnh minh họa**
- Chụp index list.
- Zoom vào filter của `UX_Appointments_Doctor_Date_Time_Active`.

**Query SQL**
```sql
SELECT
  i.name,
  OBJECT_NAME(i.object_id) AS TableName,
  i.is_unique,
  i.has_filter,
  i.filter_definition
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name NOT LIKE '__CC_Test[_]%'
  AND t.name <> 'sysdiagrams'
  AND i.type > 0
  AND i.name IS NOT NULL
ORDER BY TableName, i.name;
```

### Slide 22 - Functions

**Nội dung trên slide**
- `fn_CalculateAge`
- `fn_CheckDoctorAvailable`
- `fn_IsDoctorWorking`
- `fn_GetMedicineStock`
- `fn_IsMedicineStockEnough`
- `fn_CalculateInvoiceTotal`
- `fn_GenerateNextPatientCode`
- `fn_GenerateNextMedicalRecordCode`

**Lời thoại**
“Function giúp tái sử dụng logic tính toán trong database. Ví dụ `fn_IsDoctorWorking` được dùng để kiểm tra bác sĩ có ca làm việc ở thời điểm tạo appointment. `fn_CalculateInvoiceTotal` tính tổng hóa đơn. Các function generate code giúp tạo mã bệnh nhân và mã hồ sơ bệnh án.”

**Ảnh minh họa**
- Chụp `database/05_functions/001_core_functions.sql`.

**Query SQL**
```sql
SELECT name
FROM sys.objects
WHERE type IN ('FN','IF','TF')
  AND name <> 'fn_diagramobjects'
ORDER BY name;
```

---

## PHẦN 7. ACID VÀ TRANSACTION

### Slide 23 - ACID Trong ClinicCare

**Nội dung trên slide**
- Atomicity: cấp thuốc = trừ kho + ghi inventory + đổi status trong một transaction
- Consistency: FK, CHECK, DEFAULT giữ dữ liệu hợp lệ
- Isolation: dùng `UPDLOCK`, `HOLDLOCK`, `ROWLOCK`, `SERIALIZABLE`
- Durability: sau `COMMIT`, payment, inventory, audit log được lưu trong SQL Server

**Lời thoại**
“Trong ClinicCare, ACID được thể hiện trực tiếp ở các stored procedure. Ví dụ cấp thuốc không chỉ update một bảng. Nếu trừ kho thành công nhưng không ghi inventory thì dữ liệu sai. Vì vậy SP dùng transaction để thành công toàn bộ hoặc rollback toàn bộ.”

**Ảnh minh họa**
- Chụp đoạn `BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`, `THROW` trong SP.

**Query SQL**
Không cần.

### Slide 24 - Transaction Markers Trong SP

**Nội dung trên slide**
Tạo bảng:
`Procedure | BEGIN TRAN | ROLLBACK | UPDLOCK | HOLDLOCK | ROWLOCK | XACT_ABORT | SERIALIZABLE`

**Lời thoại**
“Slide này là bằng chứng từ database thật. Em không nói SP có transaction bằng cảm tính, mà query trực tiếp `sys.sql_modules` để kiểm tra marker như `BEGIN TRAN`, `UPDLOCK`, `HOLDLOCK`, `XACT_ABORT`, `SERIALIZABLE`.”

**Ảnh minh họa**
- Chụp output `npm.cmd run test:concurrency -- --metadata`.
- Hoặc chụp kết quả query bên dưới.

**Query SQL**
```sql
DECLARE @p TABLE (ProcedureName SYSNAME);
INSERT INTO @p VALUES
('sp_CreateAppointment'),('sp_CheckInPatient'),('sp_StartExamination'),
('sp_FinishExamination'),('sp_CreatePrescription'),('sp_AddPrescriptionDetail'),
('sp_DispenseMedicine'),('sp_PayInvoice'),('sp_CreateDoctorSchedule'),
('sp_UpdateDoctorSchedule'),('sp_SetDoctorScheduleStatus'),('sp_AdjustMedicineStock');

SELECT
  p.ProcedureName,
  CASE WHEN m.definition LIKE '%BEGIN TRAN%' THEN 'YES' ELSE 'NO' END AS BeginTran,
  CASE WHEN m.definition LIKE '%ROLLBACK%' THEN 'YES' ELSE 'NO' END AS RollbackTran,
  CASE WHEN m.definition LIKE '%UPDLOCK%' THEN 'YES' ELSE 'NO' END AS UPDLOCK,
  CASE WHEN m.definition LIKE '%HOLDLOCK%' THEN 'YES' ELSE 'NO' END AS HOLDLOCK,
  CASE WHEN m.definition LIKE '%ROWLOCK%' THEN 'YES' ELSE 'NO' END AS ROWLOCK,
  CASE WHEN m.definition LIKE '%XACT_ABORT%' THEN 'YES' ELSE 'NO' END AS XACT_ABORT,
  CASE WHEN m.definition LIKE '%SERIALIZABLE%' THEN 'YES' ELSE 'NO' END AS SERIALIZABLE
FROM @p p
LEFT JOIN sys.procedures sp ON sp.name = p.ProcedureName
LEFT JOIN sys.sql_modules m ON m.object_id = sp.object_id;
```

---

## PHẦN 8. 4 LỖI CONCURRENCY VÀ HỆ THỐNG ĐÃ XỬ LÝ

### Slide 25 - Lost Update

**Nội dung trên slide**
- Lỗi: hai người cùng cập nhật, update sau ghi đè update trước
- Ví dụ ClinicCare:
  - Hai dược sĩ cùng cấp thuốc
  - Hai manager cùng chỉnh tồn kho
- Hệ thống xử lý:
  - `sp_DispenseMedicine`
  - `sp_AdjustMedicineStock`
  - `BEGIN TRAN`
  - `UPDLOCK`, `ROWLOCK`
  - `InventoryTransactions`

**Lời thoại**
“Lost update dễ xảy ra ở tồn kho. Nếu hai người cùng đọc stock cũ rồi cùng ghi lại stock mới, một lần cập nhật có thể bị mất. Dự án xử lý bằng lock khi đọc thuốc, cập nhật trong transaction, và ghi lịch sử vào InventoryTransactions.”

**Ảnh minh họa**
- Chụp output tool: `Lost Update unsafe` và `Lost Update safe`.
- Chụp output business: `sp_AdjustMedicineStock` final stock 120.

**Query SQL**
```sql
npm.cmd run test:concurrency -- --lab
npm.cmd run test:concurrency -- --business
```

### Slide 26 - Dirty Read

**Nội dung trên slide**
- Lỗi: đọc dữ liệu chưa commit
- Ví dụ:
  - Giao dịch đang tạo/update dữ liệu nhưng chưa commit
  - Transaction khác đọc thấy dữ liệu tạm
  - Sau đó transaction đầu rollback
- Hệ thống xử lý:
  - SP chính không dùng `NOLOCK`
  - Không dùng `READ UNCOMMITTED`
  - SQL Server mặc định `READ COMMITTED`

**Lời thoại**
“Dirty read là đọc dữ liệu rác chưa commit. Trong các procedure chính của ClinicCare, em kiểm tra không thấy `NOLOCK` hoặc `READ UNCOMMITTED`. Vì vậy hệ thống dựa vào mặc định READ COMMITTED của SQL Server để tránh dirty read.”

**Ảnh minh họa**
- Chụp metadata check: `[PASS] Procedure dùng NOLOCK / READ UNCOMMITTED`.
- Chụp output Dirty Read lab.

**Query SQL**
```sql
SELECT p.name
FROM sys.procedures p
JOIN sys.sql_modules m ON p.object_id = m.object_id
WHERE UPPER(m.definition) LIKE '%NOLOCK%'
   OR UPPER(m.definition) LIKE '%READ UNCOMMITTED%';
```

### Slide 27 - Non-repeatable Read

**Nội dung trên slide**
- Lỗi: cùng transaction đọc một dòng hai lần nhưng giá trị thay đổi
- Ví dụ:
  - Thu ngân đọc invoice là `Unpaid`
  - Người khác thanh toán
  - Đọc lại thành `Paid`
- Hệ thống giảm nguy cơ:
  - `sp_PayInvoice` lock invoice bằng `UPDLOCK`, `HOLDLOCK`
  - Workflow ghi quan trọng có transaction
  - Chưa phải giải pháp global cho mọi câu SELECT

**Lời thoại**
“Non-repeatable read không phải mọi SELECT đều được khóa toàn hệ thống. Nhưng ở workflow quan trọng như thanh toán, procedure lock invoice trước khi xử lý. Vì vậy thao tác ghi quan trọng không dựa trên trạng thái cũ.”

**Ảnh minh họa**
- Chụp output `Non-repeatable Read đã được mô phỏng`.
- Chụp đoạn `sp_PayInvoice` có `Invoices WITH (UPDLOCK, HOLDLOCK)`.

**Query SQL**
```sql
npm.cmd run test:concurrency -- --lab
```

### Slide 28 - Phantom Read

**Nội dung trên slide**
- Lỗi: transaction kiểm tra tập dữ liệu, transaction khác insert thêm dòng mới
- Ví dụ:
  - Lễ tân A thấy bác sĩ 10h trống
  - Lễ tân B cũng thấy trống
  - Cả hai cùng tạo lịch
- Hệ thống xử lý:
  - `sp_CreateAppointment`
  - `SERIALIZABLE`
  - `UPDLOCK`, `HOLDLOCK`
  - `UX_Appointments_Doctor_Date_Time_Active`

**Lời thoại**
“Phantom read là lỗi rất sát với bài toán đặt lịch. ClinicCare xử lý ở hai lớp: stored procedure lock vùng lịch hẹn với SERIALIZABLE và database có unique filtered index để chặn trùng bác sĩ cùng ngày giờ.”

**Ảnh minh họa**
- Chụp output business: `sp_CreateAppointment` 1 success, 1 blocked.
- Chụp query duplicate appointment = 0.

**Query SQL**
```sql
SELECT COUNT(*) AS DuplicateGroups
FROM (
  SELECT DoctorId, AppointmentDate, AppointmentTime
  FROM Appointments
  WHERE Status NOT IN ('Cancelled','NoShow')
  GROUP BY DoctorId, AppointmentDate, AppointmentTime
  HAVING COUNT(*) > 1
) x;
```

---

## PHẦN 9. DEADLOCK

### Slide 29 - Deadlock Có Thể Xảy Ra Ở Đâu

**Nội dung trên slide**
- Deadlock: hai transaction giữ khóa của nhau và cùng chờ
- Vùng có rủi ro:
  - Cấp thuốc
  - Điều chỉnh kho
  - Thanh toán hóa đơn
  - Tạo lịch / sửa lịch bác sĩ

**Lời thoại**
“Deadlock có thể xảy ra khi hai transaction khóa tài nguyên theo thứ tự khác nhau. Trong ClinicCare, các vùng nhạy cảm là kho thuốc, đơn thuốc, hóa đơn và lịch bác sĩ vì nhiều người có thể thao tác cùng lúc.”

**Ảnh minh họa**
- Vẽ sơ đồ Transaction A khóa A rồi chờ B, Transaction B khóa B rồi chờ A.
- Chụp output deadlock lab lỗi 1205.

**Query SQL**
```sql
npm.cmd run test:concurrency -- --lab
```

### Slide 30 - Dự Án Xử Lý Deadlock Tới Đâu

**Nội dung trên slide**
- Đã giảm nguy cơ:
  - Transaction ngắn
  - `SET XACT_ABORT ON`
  - `UPDLOCK`, `HOLDLOCK`, `ROWLOCK`
  - Lock có mục tiêu
- Hiện có `backend/src/utils/deadlockRetry.ts`
- Retry hiện mới thấy dùng ở admin create/change role
- Workflow chính vẫn nên bổ sung retry 1205 rõ hơn

**Lời thoại**
“Em nói thật phần này: dự án đã giảm nguy cơ deadlock bằng transaction ngắn, XACT_ABORT và lock có mục tiêu. Backend có utility `executeWithDeadlockRetry`, hiện đang được dùng ở một số thao tác admin. Nhưng với các workflow chính như tạo lịch, cấp thuốc, thanh toán, điều chỉnh kho, nên bổ sung retry 1205 đầy đủ hơn để hệ thống chắc hơn.”

**Ảnh minh họa**
- Chụp `backend/src/utils/deadlockRetry.ts`.
- Chụp `concurrency-test.ts` phần deadlock.

**Query SQL**
Không cần.

---

## PHẦN 10. TOOL TEST VÀ EVIDENCE

### Slide 31 - Tool Test Concurrency / Deadlock

**Nội dung trên slide**
- File: `backend/src/tools/concurrency-test.ts`
- Mode:
  - `--metadata`: kiểm tra database thật
  - `--lab`: mô phỏng 5 lỗi bằng bảng `__CC_Test_*`
  - `--business`: gọi SP nghiệp vụ thật bằng demo data riêng
  - `--all`: chạy toàn bộ
- Không dùng dữ liệu thật của người dùng

**Lời thoại**
“Nhóm em có tool test riêng trong backend. Metadata mode kiểm tra procedure, index, duplicate appointment, overlap schedule. Lab mode tạo bảng test riêng để mô phỏng lost update, dirty read, non-repeatable read, phantom read và deadlock. Business mode gọi trực tiếp stored procedure thật nhưng dùng data demo prefix `__CONCURRENCY_TEST__` rồi cleanup.”

**Ảnh minh họa**
- Chụp terminal chạy `npm.cmd run test:concurrency -- --business`.
- Chụp `[PASS]` của 4 business race test.

**Query SQL / Command**
```bash
cd backend
npm.cmd run test:concurrency -- --metadata
npm.cmd run test:concurrency -- --lab
npm.cmd run test:concurrency -- --business
npm.cmd run test:concurrency -- --all
```

### Slide 32 - Evidence Nên Chụp

**Nội dung trên slide**
- Object count trong database
- ERD
- FK enabled/trusted
- CHECK constraints
- DEFAULT constraints
- Stored procedure markers
- Trigger list
- Index list
- View query result
- Duplicate appointment = 0
- DoctorSchedule overlap = 0
- Tool test `[PASS]`

**Lời thoại**
“Để chứng minh database-first, em không chỉ chụp UI. Em sẽ chụp bằng chứng database: object count, FK, CHECK, DEFAULT, trigger, index, SP marker và output test concurrency. Những ảnh này cho thấy rule nằm trong database thật.”

**Ảnh minh họa**
- Chèn ảnh ghép 4-6 screenshot: ERD, SP marker, trigger list, index list, tool PASS.

**Query SQL**
```sql
SELECT 'Duplicate active Doctor+Date+Time' AS CheckName, COUNT(*) AS Total
FROM (
  SELECT DoctorId, AppointmentDate, AppointmentTime
  FROM Appointments
  WHERE Status NOT IN ('Cancelled','NoShow')
  GROUP BY DoctorId, AppointmentDate, AppointmentTime
  HAVING COUNT(*) > 1
) x
UNION ALL
SELECT 'Overlap active DoctorSchedules', COUNT(*)
FROM (
  SELECT ds1.ScheduleId
  FROM DoctorSchedules ds1
  JOIN DoctorSchedules ds2
    ON ds1.DoctorId = ds2.DoctorId
   AND ds1.WorkDate = ds2.WorkDate
   AND ds1.ScheduleId < ds2.ScheduleId
   AND ds1.IsActive = 1
   AND ds2.IsActive = 1
   AND ds1.StartTime < ds2.EndTime
   AND ds2.StartTime < ds1.EndTime
) y
UNION ALL
SELECT 'Medicine stock negative', COUNT(*)
FROM Medicines
WHERE StockQuantity < 0;
```

---

## PHẦN 11. KẾT LUẬN

### Slide 33 - Kết Luận Database-first

**Nội dung trên slide**
- Database không chỉ lưu dữ liệu
- FK, CHECK, DEFAULT bảo vệ dữ liệu
- View hỗ trợ đọc dữ liệu theo role
- Stored procedure xử lý nghiệp vụ và transaction
- Trigger audit và chống xóa cứng
- Index tăng tốc và chống trùng lịch
- Đã xử lý tốt Lost Update, Dirty Read, Phantom Read ở workflow chính
- Non-repeatable Read được giảm ở workflow quan trọng
- Deadlock đã giảm nguy cơ, nên cải thiện thêm retry 1205

**Lời thoại**
“Kết luận của nhóm em là ClinicCare được xây dựng theo hướng database-first. SQL Server không chỉ là nơi lưu dữ liệu, mà còn kiểm soát nghiệp vụ bằng constraint, view, stored procedure, trigger, function và index. Các workflow quan trọng có transaction và lock để xử lý đồng thời. Hệ thống vẫn có điểm có thể cải thiện là retry deadlock 1205 đầy đủ hơn cho các workflow chính.”

**Ảnh minh họa**
- Chụp một slide tổng kết dạng sơ đồ: Constraint + SP + Trigger + Index + Tool PASS.

**Query SQL**
Không cần.

---

# Chia Phần Thuyết Trình Cho 5 Người

## Người 1 - Giới Thiệu Dự Án

**Phần nói**
- Slide 1, 2
- Mục tiêu: nói dễ hiểu, phòng khám cần quản lý những gì.

**Lời thoại mẫu**
“Em xin giới thiệu dự án ClinicCare, hệ thống quản lý phòng khám. Dự án hỗ trợ nhiều vai trò: lễ tân, bác sĩ, dược sĩ, thu ngân, manager và admin. Điểm chính của hệ thống là thiết kế database-first, tức là database không chỉ lưu dữ liệu mà còn giữ các rule quan trọng.”

## Người 2 - Cấu Hình Và Kiến Trúc

**Phần nói**
- Slide 3, 4
- Mục tiêu: nói công nghệ và luồng frontend -> backend -> database.

**Lời thoại mẫu**
“Frontend dùng React TypeScript. Backend dùng Node.js Express TypeScript. Database dùng SQL Server. Backend kết nối SQL Server qua file config và `.env`. Luồng xử lý đi từ frontend tới API, controller, service, repository, sau đó repository gọi stored procedure hoặc view.”

## Người 3 - UI Và Luồng Người Dùng

**Phần nói**
- Dùng slide 2 làm nền, chèn thêm ảnh UI vào slide 2 hoặc sau slide 4.
- Demo nhanh các màn hình:
  - Receptionist: patients, appointments
  - Doctor: queue, examinations
  - Pharmacist: prescriptions, inventory
  - Cashier: invoices
  - Manager: revenue, stock, doctor schedules
  - Admin: users, audit logs, database

**Lời thoại mẫu**
“Em sẽ demo nhanh luồng người dùng. Lễ tân tạo bệnh nhân và lịch hẹn. Bác sĩ thấy bệnh nhân trong queue, bắt đầu khám, lưu chẩn đoán và kê đơn. Dược sĩ thấy đơn Pending để cấp thuốc. Thu ngân tạo hóa đơn và thanh toán. Manager theo dõi doanh thu, tồn kho và lịch bác sĩ. Admin quản lý user, audit log và thông tin database.”

## Người 4 - Backend/API Gọi Stored Procedure

**Phần nói**
- Slide 4 và slide 14 ở mức nhẹ.
- Chụp repository gọi `.execute("dbo.sp_CreateAppointment")`, `.execute("dbo.sp_DispenseMedicine")`, `.execute("dbo.sp_PayInvoice")`.

**Lời thoại mẫu**
“Backend ở đây đóng vai trò trung gian. API nhận request, controller chuyển xuống service, repository gọi stored procedure. Ví dụ tạo lịch hẹn gọi `sp_CreateAppointment`, cấp thuốc gọi `sp_DispenseMedicine`, thanh toán gọi `sp_PayInvoice`. Nhờ vậy rule quan trọng không nằm rải rác ở frontend.”

## Bạn - Phần Khó, Database-first

**Phần nói**
- Slide 5 đến slide 33
- Trọng tâm:
  - Database object
  - Tables, ERD
  - FK/CHECK/DEFAULT
  - Views
  - Stored procedures
  - Triggers, indexes, functions
  - ACID
  - Concurrency
  - Deadlock
  - Tool test và evidence

**Lời thoại mở đầu cho phần của bạn**
“Em sẽ đi vào phần trọng tâm của bài: tại sao nói dự án này database-first. Em sẽ chứng minh bằng object thật trong SQL Server, bằng procedure thật, constraint thật, trigger thật, index thật và tool test concurrency.”

**Lời thoại kết nối khi vào concurrency**
“Sau khi chứng minh database có rule, em sẽ chứng minh rule đó có tác dụng trong môi trường nhiều người thao tác cùng lúc. Đây là phần quan trọng vì phòng khám có thể có nhiều lễ tân, dược sĩ, thu ngân cùng dùng hệ thống.”

**Lời thoại kết luận**
“Như vậy phần database của ClinicCare đã xử lý nhiều vấn đề mà nếu chỉ viết ở frontend/backend sẽ dễ bị bypass hoặc lỗi khi nhiều người thao tác. Điểm cần cải thiện tiếp theo là bổ sung retry deadlock 1205 đầy đủ cho các workflow chính.”

---

# Câu Hỏi Giảng Viên Có Thể Hỏi Và Cách Trả Lời

## 1. Vì sao gọi là database-first?

**Trả lời**
“Vì database không chỉ lưu dữ liệu. Rule quan trọng nằm trong SQL Server: FK, CHECK, DEFAULT, stored procedure, trigger, function và index. Backend chủ yếu gọi stored procedure thay vì tự update nhiều bảng tùy ý.”

## 2. Nếu frontend bị lỗi gửi status sai thì sao?

**Trả lời**
“Database có CHECK constraint. Ví dụ `CK_Appointments_Status`, `CK_Prescriptions_Status`, `CK_Invoices_Status` chỉ cho phép các trạng thái hợp lệ. Dù lỗi từ UI hoặc backend, database vẫn chặn.”

## 3. Làm sao chặn hai lịch hẹn cùng bác sĩ cùng giờ?

**Trả lời**
“Có hai lớp. Lớp stored procedure `sp_CreateAppointment` dùng `SERIALIZABLE`, `UPDLOCK`, `HOLDLOCK` để khóa vùng lịch. Lớp index có `UX_Appointments_Doctor_Date_Time_Active`, unique filtered index chặn trùng lịch active.”

## 4. Vì sao vẫn cần unique index nếu SP đã check trùng?

**Trả lời**
“SP là lớp kiểm tra nghiệp vụ, còn unique index là lớp bảo vệ cuối cùng ở database. Nếu có đường khác insert trực tiếp hoặc race condition rất sát, unique index vẫn chặn dữ liệu trùng.”

## 5. Dược sĩ cấp thuốc thì database bảo vệ gì?

**Trả lời**
“`sp_DispenseMedicine` kiểm tra đơn thuốc Pending, lock đơn thuốc và thuốc, kiểm tra tồn kho, trừ stock, ghi `InventoryTransactions OUT`, rồi đổi prescription sang Dispensed trong một transaction.”

## 6. Nếu hai dược sĩ bấm cấp cùng lúc?

**Trả lời**
“Tool `--business` đã test case này. Kết quả kỳ vọng là một request thành công, request còn lại bị chặn vì đơn không còn Pending. Tồn kho chỉ bị trừ một lần.”

## 7. Thanh toán trùng hóa đơn có bị không?

**Trả lời**
“`sp_PayInvoice` lock invoice bằng `UPDLOCK`, `HOLDLOCK`, kiểm tra invoice còn Unpaid rồi mới insert payment và đổi status Paid. Tool business test cho thấy chỉ có một payment hợp lệ.”

## 8. Dirty read được xử lý thế nào?

**Trả lời**
“Các procedure chính không dùng `NOLOCK` hoặc `READ UNCOMMITTED`. SQL Server mặc định `READ COMMITTED`, nên không đọc dữ liệu chưa commit.”

## 9. Non-repeatable read đã xử lý hoàn toàn chưa?

**Trả lời**
“Không nói là xử lý global toàn bộ. Dự án giảm nguy cơ ở workflow ghi quan trọng bằng lock, ví dụ `sp_PayInvoice` lock invoice trước khi thanh toán. Các câu SELECT thường thì chưa đặt isolation cao toàn hệ thống.”

## 10. Phantom read trong đặt lịch xử lý thế nào?

**Trả lời**
“`sp_CreateAppointment` dùng `SERIALIZABLE`, `UPDLOCK`, `HOLDLOCK` để khóa vùng lịch và có unique filtered index. Vì vậy hai lễ tân không thể tạo hai lịch active cho cùng bác sĩ cùng ngày giờ.”

## 11. Deadlock đã xử lý hoàn chỉnh chưa?

**Trả lời**
“Dự án đã giảm nguy cơ bằng transaction ngắn, XACT_ABORT và lock có mục tiêu. Backend có utility retry deadlock nhưng hiện mới thấy dùng ở một số thao tác admin. Workflow chính nên bổ sung retry 1205 rõ hơn.”

## 12. Trigger dùng để làm gì?

**Trả lời**
“Có hai nhóm trigger. Audit trigger ghi log khi update bệnh nhân, thuốc, hóa đơn, đơn thuốc, lịch bác sĩ. Protection trigger chặn delete cứng dữ liệu quan trọng như appointment, doctors, medicines, rooms.”

## 13. Vì sao không cho delete cứng appointment?

**Trả lời**
“Appointment là dữ liệu lịch sử nghiệp vụ. Nếu xóa cứng sẽ mất dấu vết. Trigger `trg_Prevent_Delete_Appointments` buộc chuyển trạng thái Cancelled thay vì DELETE.”

## 14. View có cần thiết không, backend tự join được mà?

**Trả lời**
“Backend tự join được, nhưng view giúp chuẩn hóa dữ liệu hiển thị theo role. Ví dụ doctor queue, pharmacist pending prescriptions, cashier unpaid invoices. Backend đọc view đơn giản và ít lặp query.”

## 15. Function nào quan trọng nhất?

**Trả lời**
“Với lịch hẹn, `fn_IsDoctorWorking` và `fn_CheckDoctorAvailable` quan trọng vì hỗ trợ kiểm tra bác sĩ có ca làm việc. Với kho thuốc có `fn_GetMedicineStock` và `fn_IsMedicineStockEnough`.”

## 16. Vì sao có InventoryTransactions?

**Trả lời**
“Vì không nên chỉ nhìn StockQuantity hiện tại. InventoryTransactions ghi lịch sử nhập/xuất/điều chỉnh kho, giúp audit được thuốc thay đổi vì lý do gì và ai thực hiện.”

## 17. Nếu database có trigger chặn delete thì cleanup test làm sao?

**Trả lời**
“Tool business không delete cứng dữ liệu nghiệp vụ quan trọng. Nó tạo demo data prefix `__CONCURRENCY_TEST__`, sau đó soft cleanup bằng Cancelled, IsActive = 0 hoặc IsDeleted = 1.”

## 18. Tool test có dùng dữ liệu thật không?

**Trả lời**
“Không. Lab mode dùng bảng riêng `__CC_Test_*`. Business mode tạo dữ liệu demo riêng prefix `__CONCURRENCY_TEST__` hoặc email `@cliniccare.demo`, gọi SP thật, rồi cleanup.”

## 19. Số liệu object lấy ở đâu?

**Trả lời**
“Lấy trực tiếp từ system catalog của SQL Server như `sys.tables`, `sys.views`, `sys.procedures`, `sys.foreign_keys`, `sys.check_constraints`, `sys.default_constraints`, `sys.indexes`. Query có trong slide 5.”

## 20. Điểm mạnh nhất của database trong dự án là gì?

**Trả lời**
“Điểm mạnh nhất là các workflow nhạy cảm như tạo lịch, cấp thuốc, thanh toán và chỉnh kho không chỉ xử lý ở UI/backend. Database có transaction, lock, constraint, trigger, index và tool test để chứng minh.”

