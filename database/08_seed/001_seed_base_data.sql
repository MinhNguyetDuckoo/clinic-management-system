USE ClinicManagementDB;
GO

INSERT INTO Roles (RoleName, Description)
VALUES
('Admin', N'Quản trị hệ thống'),
('Receptionist', N'Lễ tân'),
('Doctor', N'Bác sĩ'),
('Pharmacist', N'Dược sĩ'),
('Cashier', N'Thu ngân'),
('Patient', N'Bệnh nhân'),
('Manager', N'Quản lý phòng khám');
GO

INSERT INTO AppointmentStatuses (StatusName)
VALUES
('Scheduled'),
('CheckedIn'),
('InProgress'),
('Completed'),
('Cancelled'),
('NoShow');
GO

INSERT INTO Specialties (SpecialtyName, Description)
VALUES
(N'Nội tổng quát', N'Khám nội tổng quát'),
(N'Nhi khoa', N'Khám trẻ em'),
(N'Tai mũi họng', N'Khám tai mũi họng'),
(N'Da liễu', N'Khám da liễu'),
(N'Tim mạch', N'Khám tim mạch');
GO

INSERT INTO Rooms (RoomName, RoomType)
VALUES
(N'Phòng khám 101', N'Examination'),
(N'Phòng khám 102', N'Examination'),
(N'Phòng xét nghiệm 201', N'Laboratory'),
(N'Quầy thuốc', N'Pharmacy');
GO

INSERT INTO MedicineCategories (CategoryName, Description)
VALUES
(N'Giảm đau', N'Thuốc giảm đau, hạ sốt'),
(N'Kháng sinh', N'Thuốc kháng sinh'),
(N'Vitamin', N'Vitamin và khoáng chất'),
(N'Dị ứng', N'Thuốc dị ứng');
GO

INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity)
VALUES
(1, N'Paracetamol 500mg', N'Viên', 1000, 1000, 100),
(2, N'Amoxicillin 500mg', N'Viên', 2500, 500, 50),
(3, N'Vitamin C 500mg', N'Viên', 1500, 800, 80),
(4, N'Loratadine 10mg', N'Viên', 2000, 300, 30);
GO

INSERT INTO Services (ServiceName, ServiceType, Price)
VALUES
(N'Khám tổng quát', N'Consultation', 150000),
(N'Xét nghiệm máu', N'Laboratory', 120000),
(N'Xét nghiệm nước tiểu', N'Laboratory', 80000),
(N'Điện tim', N'Diagnostic', 100000),
(N'Siêu âm bụng', N'Diagnostic', 180000);
GO