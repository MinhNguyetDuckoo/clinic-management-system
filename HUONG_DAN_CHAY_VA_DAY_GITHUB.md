# HUONG DAN CHAY PROJECT VA DAY CODE LEN GITHUB

Tai lieu nay dung cho du an **ClinicManagementDB / ClinicCare**.

Muc tieu:
- Huong dan clone/chay project tren may khac.
- Huong dan dua source code len GitHub.
- Tranh commit nham file cau hinh rieng tu, mat khau, `node_modules`, log va file tam.

---

## 1. Tong quan project

Project gom 3 phan chinh:

```text
clinic-management-system/
+-- backend/      Node.js + Express + TypeScript
+-- frontend/     React + TypeScript + Vite
+-- database/     SQL Server scripts
+-- docker-compose.yml
```

Cong nghe dang dung:
- Frontend: React, TypeScript, Vite.
- Backend: Node.js, Express, TypeScript.
- Database: SQL Server.
- Kien truc database-first: nghiep vu quan trong duoc bao ve bang stored procedures, triggers, foreign keys, check/default constraints va transactions.

Port mac dinh:
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- API base URL frontend dang goi: `http://localhost:5000/api`
- SQL Server: `localhost,1433`

---

## 2. Yeu cau truoc khi chay

Can cai san:
- Node.js LTS.
- npm.
- SQL Server hoac Docker Desktop.
- SSMS hoac Azure Data Studio de chay file SQL.
- Git.

Kiem tra nhanh:

```bash
node -v
npm -v
git --version
```

Neu dung SQL Server bang Docker:

```bash
docker compose up -d
```

Thong tin trong `docker-compose.yml` hien tai:

```text
Server: localhost
Port: 1433
User: sa
Password: YourStrong@Passw0rd
```

---

## 3. Cai dat database

Mo SSMS/Azure Data Studio va chay cac file SQL trong thu muc `database/` theo dung thu tu.

Thu tu nen chay:

```text
database/01_init/
database/02_tables/
database/03_indexes/
database/04_views/
database/05_functions/
database/06_procedures/
database/07_triggers/
database/08_seed/
```

Neu can test SQL:

```text
database/09_tests/
database/10_concurrency/
```

Luu y:
- Chay file tao database truoc.
- Sau do chay tables, indexes, views, functions, procedures, triggers.
- Seed data chi chay sau khi schema va stored procedures da co day du.
- Khong chay cac script concurrency tren database that neu khong hieu tac dung, vi day la script phuc vu kiem tra race condition/lost update.

Kiem tra database sau khi tao:

```sql
USE ClinicManagementDB;

SELECT COUNT(*) AS TableCount
FROM sys.tables;

SELECT COUNT(*) AS ProcedureCount
FROM sys.procedures;

SELECT COUNT(*) AS ViewCount
FROM sys.views;
```

---

## 4. Cau hinh backend

Vao thu muc backend:

```bash
cd backend
npm install
```

Tao file `backend/.env`.

Vi du cau hinh khi dung Docker SQL Server:

```env
PORT=5000
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=ClinicManagementDB
JWT_SECRET=cliniccare_secret_key
```

Neu dung SQL Server local bang Windows Authentication thi project hien tai chua cau hinh trusted connection, nen cach de chay on dinh nhat la dung SQL Login, vi `backend/src/config/database.ts` dang doc:

```ts
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
server: process.env.DB_SERVER || "localhost",
port: Number(process.env.DB_PORT || 1433),
database: process.env.DB_DATABASE
```

Chay backend:

```bash
npm run dev
```

Neu thanh cong, terminal se hien:

```text
Connected to SQL Server
Server is running on http://localhost:5000
```

Kiem tra API:

```text
http://localhost:5000/health
```

Ket qua mong doi:

```json
{
  "status": "OK",
  "timestamp": "..."
}
```

Build backend:

```bash
npm run build
npm start
```

---

## 5. Chay frontend

Mo terminal moi, vao thu muc frontend:

```bash
cd frontend
npm install
npm run dev
```

Mo trinh duyet:

```text
http://localhost:5173
```

Frontend dang cau hinh API tai:

```ts
baseURL: "http://localhost:5000/api"
```

File lien quan:

```text
frontend/src/api/axiosClient.ts
```

Build frontend:

```bash
npm run build
```

---

## 6. Tai khoan dang nhap

Tai khoan demo phu thuoc vao script seed trong:

```text
database/08_seed/
```

Neu chua dang nhap duoc:
- Kiem tra da chay seed data chua.
- Kiem tra bang `Users`.
- Kiem tra backend da ket noi dung database `ClinicManagementDB`.

Query kiem tra nhanh:

```sql
USE ClinicManagementDB;

SELECT UserId, Username, Role, IsActive
FROM Users
ORDER BY UserId;
```

---

## 7. Kiem tra nhanh cac module

Sau khi chay frontend va backend:

```text
Admin:        /admin
Receptionist: /receptionist/appointments
Doctor:       /doctor/examinations
Pharmacist:   /pharmacist/prescriptions
Cashier:      /cashier/invoices
Manager:      /manager
```

Cac API quan trong:

```text
GET    /api/health
POST   /api/auth/login
GET    /api/patients
GET    /api/appointments
GET    /api/doctors
GET    /api/rooms
GET    /api/doctor-schedules
GET    /api/medicines
GET    /api/invoices
GET    /api/admin/database/overview
```

---

## 8. Kiem tra database-first sau khi chay

Kiem tra stored procedures:

```sql
SELECT name
FROM sys.procedures
WHERE name IN (
    'sp_CreateAppointment',
    'sp_CheckInPatient',
    'sp_StartExamination',
    'sp_DispenseMedicine',
    'sp_CreateInvoiceFromExamination',
    'sp_PayInvoice',
    'sp_CreateDoctorSchedule',
    'sp_UpdateDoctorSchedule',
    'sp_SetDoctorScheduleStatus',
    'sp_CreateMedicine',
    'sp_UpdateMedicine',
    'sp_AdjustMedicineStock',
    'sp_SetMedicineStatus'
)
ORDER BY name;
```

Kiem tra triggers:

```sql
SELECT
    tr.name AS TriggerName,
    tb.name AS TableName,
    tr.is_disabled
FROM sys.triggers tr
JOIN sys.tables tb ON tr.parent_id = tb.object_id
ORDER BY tb.name, tr.name;
```

Kiem tra orphan data:

```sql
SELECT COUNT(*) AS OrphanAppointmentsPatients
FROM Appointments a
LEFT JOIN Patients p ON a.PatientId = p.PatientId
WHERE p.PatientId IS NULL;

SELECT COUNT(*) AS OrphanAppointmentsDoctors
FROM Appointments a
LEFT JOIN Doctors d ON a.DoctorId = d.DoctorId
WHERE d.DoctorId IS NULL;

SELECT COUNT(*) AS OrphanAppointmentsRooms
FROM Appointments a
LEFT JOIN Rooms r ON a.RoomId = r.RoomId
WHERE a.RoomId IS NOT NULL
  AND r.RoomId IS NULL;
```

Kiem tra trung lich hen active:

```sql
SELECT DoctorId, AppointmentDate, AppointmentTime, COUNT(*) AS DuplicateCount
FROM Appointments
WHERE Status IN ('Scheduled', 'CheckedIn', 'InProgress')
GROUP BY DoctorId, AppointmentDate, AppointmentTime
HAVING COUNT(*) > 1;
```

Kiem tra overlap lich bac si:

```sql
SELECT
    a.ScheduleId AS ScheduleA,
    b.ScheduleId AS ScheduleB,
    a.DoctorId,
    a.WorkDate,
    a.StartTime AS StartA,
    a.EndTime AS EndA,
    b.StartTime AS StartB,
    b.EndTime AS EndB
FROM DoctorSchedules a
JOIN DoctorSchedules b
    ON a.DoctorId = b.DoctorId
   AND a.WorkDate = b.WorkDate
   AND a.ScheduleId < b.ScheduleId
   AND a.IsActive = 1
   AND b.IsActive = 1
   AND a.StartTime < b.EndTime
   AND a.EndTime > b.StartTime;
```

---

## 9. Chuan bi truoc khi day code len GitHub

Quan trong: hien tai repo co file `.env` trong `backend/`. Khong duoc commit file nay len GitHub.

Nen tao file `.gitignore` o root voi noi dung:

```gitignore
# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Build output
dist/
backend/dist/
frontend/dist/

# Environment files
.env
.env.*
backend/.env
backend/.env.*
frontend/.env
frontend/.env.*

# Logs
*.log
backend-dev.log
backend-dev.err.log
frontend-dev.log
frontend-dev.err.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/

# Temporary Office files
~$*.docx
```

Nen tao them file `backend/.env.example` de nguoi khac biet can cau hinh gi:

```env
PORT=5000
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=ClinicManagementDB
JWT_SECRET=change_me
```

Luu y:
- Commit `.env.example`.
- Khong commit `.env`.
- Khong commit `node_modules`.
- Khong commit file log.
- Khong commit file tam Word dang bat dau bang `~$`.

---

## 10. Khoi tao Git neu project chua co Git

Tai root project:

```bash
git init
git status
```

Them file vao staging:

```bash
git add .
```

Kiem tra truoc khi commit:

```bash
git status
```

Neu thay cac file nay trong danh sach commit thi phai bo ra:

```text
backend/.env
node_modules/
backend/node_modules/
frontend/node_modules/
*.log
~$*.docx
```

Bo file da add nham:

```bash
git restore --staged backend/.env
git restore --staged backend-dev.log
git restore --staged frontend-dev.log
```

Commit lan dau:

```bash
git commit -m "Initial commit ClinicCare project"
```

---

## 11. Tao repository tren GitHub

Lam tren GitHub:

1. Vao `https://github.com`.
2. Chon **New repository**.
3. Dat ten, vi du:

```text
clinic-management-system
```

4. Khong tick tao README neu local project da co source.
5. Chon Public hoac Private.
6. Bam **Create repository**.

GitHub se hien URL dang:

```text
https://github.com/<username>/clinic-management-system.git
```

---

## 12. Ket noi local repo voi GitHub

Thay `<username>` bang tai khoan GitHub cua ban:

```bash
git remote add origin https://github.com/<username>/clinic-management-system.git
git branch -M main
git push -u origin main
```

Neu Git bao remote da ton tai:

```bash
git remote -v
git remote set-url origin https://github.com/<username>/clinic-management-system.git
git push -u origin main
```

---

## 13. Cap nhat code len GitHub cac lan sau

Moi lan sua code xong:

```bash
git status
git add .
git commit -m "Mo ta ngan gon thay doi"
git push
```

Vi du:

```bash
git commit -m "Add manager database-first procedures"
```

---

## 14. Clone project tren may khac

```bash
git clone https://github.com/<username>/clinic-management-system.git
cd clinic-management-system
```

Chay database scripts trong `database/`.

Cai backend:

```bash
cd backend
npm install
```

Tao `backend/.env` theo mau `backend/.env.example`.

Chay backend:

```bash
npm run dev
```

Mo terminal khac:

```bash
cd frontend
npm install
npm run dev
```

Mo:

```text
http://localhost:5173
```

---

## 15. Loi thuong gap

### 15.1. Backend bao loi ket noi SQL Server

Kiem tra:
- SQL Server da chay chua.
- Port `1433` co dung khong.
- `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_DATABASE` trong `.env` co dung khong.
- Database `ClinicManagementDB` da duoc tao chua.

Test nhanh:

```sql
SELECT name
FROM sys.databases
WHERE name = 'ClinicManagementDB';
```

### 15.2. Frontend goi API bi loi

Kiem tra backend co chay tai:

```text
http://localhost:5000/health
```

Kiem tra file:

```text
frontend/src/api/axiosClient.ts
```

API base URL phai la:

```text
http://localhost:5000/api
```

### 15.3. Login that bai

Kiem tra:
- Da chay seed data chua.
- Bang `Users` co user active khong.
- Password trong seed co dung voi tai khoan dang dung khong.

```sql
SELECT UserId, Username, Role, IsActive
FROM Users;
```

### 15.4. Git push bi yeu cau dang nhap

GitHub khong con cho day code bang password tai khoan thuong.

Cach xu ly:
- Dang nhap GitHub tren VS Code.
- Hoac dung GitHub CLI.
- Hoac tao Personal Access Token va dung token thay password.

### 15.5. Lo commit nham `.env`

Neu chua push:

```bash
git restore --staged backend/.env
```

Neu da commit nhung chua push:

```bash
git rm --cached backend/.env
git commit -m "Remove env file from git tracking"
```

Sau do doi lai password database/JWT secret neu da lo tren GitHub.

---

## 16. Checklist truoc khi nop bai hoac gui link GitHub

- [ ] Backend chay duoc bang `npm run dev`.
- [ ] Frontend chay duoc bang `npm run dev`.
- [ ] Database tao duoc tu scripts trong `database/`.
- [ ] Dang nhap duoc it nhat mot tai khoan demo.
- [ ] Tao lich hen, kham benh, ke don, cap thuoc, thanh toan chay duoc.
- [ ] Module Manager tao lich bac si va quan ly thuoc chay duoc.
- [ ] `.env` khong bi commit.
- [ ] `node_modules` khong bi commit.
- [ ] File log khong bi commit.
- [ ] GitHub repo co source backend, frontend, database va file huong dan.

---

## 17. Lenh tom tat nhanh

Chay SQL Server bang Docker:

```bash
docker compose up -d
```

Chay backend:

```bash
cd backend
npm install
npm run dev
```

Chay frontend:

```bash
cd frontend
npm install
npm run dev
```

Day code len GitHub:

```bash
git init
git add .
git commit -m "Initial commit ClinicCare project"
git remote add origin https://github.com/<username>/clinic-management-system.git
git branch -M main
git push -u origin main
```

Cap nhat code:

```bash
git status
git add .
git commit -m "Update ClinicCare project"
git push
```
