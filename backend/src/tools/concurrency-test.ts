import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

type MarkerResult = {
  Procedure: string;
  Exists: "YES" | "NO";
  "BEGIN TRAN": "YES" | "NO";
  COMMIT: "YES" | "NO";
  ROLLBACK: "YES" | "NO";
  UPDLOCK: "YES" | "NO";
  HOLDLOCK: "YES" | "NO";
  ROWLOCK: "YES" | "NO";
  XACT_ABORT: "YES" | "NO";
  SERIALIZABLE: "YES" | "NO";
};

type CheckResult = {
  Check: string;
  Status: "PASS" | "WARN" | "FAIL";
  Detail: string;
};

type RunMode = "metadata" | "lab" | "business" | "all";

type BusinessContext = {
  tag: string;
  suffix: string;
  workDate: string;
  appointmentTime: string;
  doctorUserId: number;
  actorUserId: number;
  doctorId: number;
  roomId: number;
  appointmentPatientAId: number;
  appointmentPatientBId: number;
  adjustMedicineId: number;
  dispenseMedicineId: number;
  prescriptionId: number;
  invoiceId: number;
  invoiceAmount: number;
};

const importantProcedures = [
  "sp_CreateAppointment",
  "sp_CheckInPatient",
  "sp_StartExamination",
  "sp_FinishExamination",
  "sp_CreatePrescription",
  "sp_AddPrescriptionDetail",
  "sp_DispenseMedicine",
  "sp_PayInvoice",
  "sp_CreateDoctorSchedule",
  "sp_UpdateDoctorSchedule",
  "sp_SetDoctorScheduleStatus",
  "sp_AdjustMedicineStock"
];

function dbConfig(): sql.config {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_DATABASE || "ClinicManagementDB",
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

async function newPool() {
  const pool = new sql.ConnectionPool(dbConfig());
  await pool.connect();
  return pool;
}

function yesNo(value: boolean): "YES" | "NO" {
  return value ? "YES" : "NO";
}

function pass(message: string) {
  console.log(`[PASS] ${message}`);
}

function warn(message: string) {
  console.log(`[WARN] ${message}`);
}

function fail(message: string) {
  console.log(`[FAIL] ${message}`);
}

function isDeadlockError(error: any) {
  return error?.number === 1205 || error?.originalError?.info?.number === 1205;
}

function compactSqlError(error: any) {
  const number = error?.number || error?.originalError?.info?.number || "N/A";
  const message = error?.message || String(error);
  return `SQL ${number}: ${message}`;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function rollbackQuietly(transaction: sql.Transaction) {
  try {
    await transaction.rollback();
  } catch {
    // Transaction may already be rolled back by SQL Server after an error.
  }
}

async function setupLabTables(pool: sql.ConnectionPool) {
  await pool.request().batch(`
    IF OBJECT_ID('__CC_Test_Counter', 'U') IS NULL
    BEGIN
      CREATE TABLE __CC_Test_Counter
      (
        Id INT NOT NULL PRIMARY KEY,
        Value INT NOT NULL
      );
    END;

    IF OBJECT_ID('__CC_Test_Appointments', 'U') IS NULL
    BEGIN
      CREATE TABLE __CC_Test_Appointments
      (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        DoctorId INT NOT NULL,
        AppointmentDate DATE NOT NULL,
        AppointmentTime TIME NOT NULL,
        Status NVARCHAR(30) NOT NULL
      );
    END;

    IF OBJECT_ID('__CC_Test_DeadlockA', 'U') IS NULL
    BEGIN
      CREATE TABLE __CC_Test_DeadlockA
      (
        Id INT NOT NULL PRIMARY KEY,
        Value INT NOT NULL
      );
    END;

    IF OBJECT_ID('__CC_Test_DeadlockB', 'U') IS NULL
    BEGIN
      CREATE TABLE __CC_Test_DeadlockB
      (
        Id INT NOT NULL PRIMARY KEY,
        Value INT NOT NULL
      );
    END;
  `);
}

async function resetCounter(pool: sql.ConnectionPool, value = 0) {
  await pool.request().input("Value", sql.Int, value).query(`
    DELETE FROM __CC_Test_Counter;
    INSERT INTO __CC_Test_Counter (Id, Value) VALUES (1, @Value);
  `);
}

async function resetAppointments(pool: sql.ConnectionPool) {
  await pool.request().query(`
    DELETE FROM __CC_Test_Appointments;
    INSERT INTO __CC_Test_Appointments (DoctorId, AppointmentDate, AppointmentTime, Status)
    VALUES (101, '2026-05-03', '10:00', 'Scheduled');
  `);
}

async function resetDeadlockTables(pool: sql.ConnectionPool) {
  await pool.request().query(`
    DELETE FROM __CC_Test_DeadlockA;
    DELETE FROM __CC_Test_DeadlockB;
    INSERT INTO __CC_Test_DeadlockA (Id, Value) VALUES (1, 0);
    INSERT INTO __CC_Test_DeadlockB (Id, Value) VALUES (1, 0);
  `);
}

async function readCounter(pool: sql.ConnectionPool) {
  const result = await pool.request().query(`SELECT Value FROM __CC_Test_Counter WHERE Id = 1;`);
  return Number(result.recordset[0]?.Value ?? 0);
}

async function metadataCheck(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHẦN 1: Metadata check trên database thật");
  console.log("============================================================\n");

  const modules = await pool.request().query(`
    SELECT p.name AS ProcedureName, m.definition
    FROM sys.procedures p
    LEFT JOIN sys.sql_modules m ON p.object_id = m.object_id
    WHERE p.name IN (${importantProcedures.map((name) => `'${name}'`).join(", ")})
    ORDER BY p.name;
  `);

  const moduleMap = new Map<string, string>(
    modules.recordset.map((row: any) => [String(row.ProcedureName), String(row.definition || "").toUpperCase()])
  );

  const markerTable: MarkerResult[] = importantProcedures.map((procedure) => {
    const definition = moduleMap.get(procedure) || "";

    return {
      Procedure: procedure,
      Exists: definition ? "YES" : "NO",
      "BEGIN TRAN": yesNo(definition.includes("BEGIN TRAN")),
      COMMIT: yesNo(definition.includes("COMMIT")),
      ROLLBACK: yesNo(definition.includes("ROLLBACK")),
      UPDLOCK: yesNo(definition.includes("UPDLOCK")),
      HOLDLOCK: yesNo(definition.includes("HOLDLOCK")),
      ROWLOCK: yesNo(definition.includes("ROWLOCK")),
      XACT_ABORT: yesNo(definition.includes("XACT_ABORT")),
      SERIALIZABLE: yesNo(definition.includes("SERIALIZABLE"))
    };
  });

  console.table(markerTable);

  const indexResult = await pool.request().query(`
    SELECT COUNT(*) AS Total
    FROM sys.indexes
    WHERE name = 'UX_Appointments_Doctor_Date_Time_Active'
      AND object_id = OBJECT_ID('Appointments');
  `);

  const duplicateDoctor = await pool.request().query(`
    SELECT COUNT(*) AS Total
    FROM (
      SELECT DoctorId, AppointmentDate, AppointmentTime
      FROM Appointments
      WHERE Status NOT IN ('Cancelled', 'NoShow')
      GROUP BY DoctorId, AppointmentDate, AppointmentTime
      HAVING COUNT(*) > 1
    ) d;
  `);

  const duplicateRoom = await pool.request().query(`
    SELECT COUNT(*) AS Total
    FROM (
      SELECT RoomId, AppointmentDate, AppointmentTime
      FROM Appointments
      WHERE Status NOT IN ('Cancelled', 'NoShow')
        AND RoomId IS NOT NULL
      GROUP BY RoomId, AppointmentDate, AppointmentTime
      HAVING COUNT(*) > 1
    ) d;
  `);

  const overlapSchedules = await pool.request().query(`
    SELECT COUNT(*) AS Total
    FROM DoctorSchedules ds1
    INNER JOIN DoctorSchedules ds2
      ON ds1.DoctorId = ds2.DoctorId
     AND ds1.WorkDate = ds2.WorkDate
     AND ds1.ScheduleId < ds2.ScheduleId
     AND ds1.IsActive = 1
     AND ds2.IsActive = 1
     AND ds1.StartTime < ds2.EndTime
     AND ds2.StartTime < ds1.EndTime;
  `);

  const unsafeRead = await pool.request().query(`
    SELECT p.name AS ProcedureName
    FROM sys.procedures p
    INNER JOIN sys.sql_modules m ON p.object_id = m.object_id
    WHERE UPPER(m.definition) LIKE '%NOLOCK%'
       OR UPPER(m.definition) LIKE '%READ UNCOMMITTED%'
    ORDER BY p.name;
  `);

  const checks: CheckResult[] = [
    {
      Check: "Index UX_Appointments_Doctor_Date_Time_Active",
      Status: Number(indexResult.recordset[0].Total) > 0 ? "PASS" : "WARN",
      Detail: Number(indexResult.recordset[0].Total) > 0 ? "Index tồn tại" : "Chưa thấy index này"
    },
    {
      Check: "Duplicate active appointment theo DoctorId + Date + Time",
      Status: Number(duplicateDoctor.recordset[0].Total) === 0 ? "PASS" : "FAIL",
      Detail: `${duplicateDoctor.recordset[0].Total} nhóm trùng`
    },
    {
      Check: "Duplicate active appointment theo RoomId + Date + Time",
      Status: Number(duplicateRoom.recordset[0].Total) === 0 ? "PASS" : "FAIL",
      Detail: `${duplicateRoom.recordset[0].Total} nhóm trùng`
    },
    {
      Check: "Overlap active DoctorSchedules",
      Status: Number(overlapSchedules.recordset[0].Total) === 0 ? "PASS" : "FAIL",
      Detail: `${overlapSchedules.recordset[0].Total} cặp overlap`
    },
    {
      Check: "Procedure dùng NOLOCK / READ UNCOMMITTED",
      Status: unsafeRead.recordset.length === 0 ? "PASS" : "WARN",
      Detail: unsafeRead.recordset.length === 0
        ? "Không thấy marker unsafe read trong procedure"
        : unsafeRead.recordset.map((row: any) => row.ProcedureName).join(", ")
    }
  ];

  console.table(checks);

  for (const check of checks) {
    const message = `${check.Check}: ${check.Detail}`;
    if (check.Status === "PASS") pass(message);
    else if (check.Status === "WARN") warn(message);
    else fail(message);
  }
}

async function lostUpdateLab(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHẦN 2: Lab mô phỏng Lost Update");
  console.log("============================================================\n");

  await resetCounter(pool, 0);

  async function unsafeWorker(name: string) {
    const workerPool = await newPool();
    const transaction = new sql.Transaction(workerPool);

    try {
      await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
      const request = new sql.Request(transaction);
      const read = await request.query(`SELECT Value FROM __CC_Test_Counter WHERE Id = 1;`);
      const oldValue = Number(read.recordset[0].Value);

      // Giữ transaction mở để hai session cùng đọc giá trị cũ trước khi ghi.
      await request.query(`WAITFOR DELAY '00:00:01';`);
      await request.input("NewValue", sql.Int, oldValue + 1).query(`
        UPDATE __CC_Test_Counter
        SET Value = @NewValue
        WHERE Id = 1;
      `);
      await transaction.commit();
      return { worker: name, oldValue, writtenValue: oldValue + 1 };
    } catch (error) {
      await rollbackQuietly(transaction);
      throw error;
    } finally {
      await workerPool.close();
    }
  }

  const unsafeResults = await Promise.all([unsafeWorker("User A"), unsafeWorker("User B")]);
  const unsafeFinalValue = await readCounter(pool);
  console.table(unsafeResults);
  console.table([{ Test: "Lost Update unsafe", ExpectedIfLostUpdate: 1, ActualValue: unsafeFinalValue }]);

  if (unsafeFinalValue === 1) {
    pass("Lost Update unsafe đã được mô phỏng: hai user cùng +1 nhưng kết quả cuối chỉ là 1.");
  } else {
    warn(`Lost Update unsafe không tái hiện đúng trong lần chạy này, giá trị cuối = ${unsafeFinalValue}.`);
  }

  await resetCounter(pool, 0);

  async function safeWorker(name: string) {
    const workerPool = await newPool();
    try {
      await workerPool.request().query(`
        UPDATE __CC_Test_Counter
        SET Value = Value + 1
        WHERE Id = 1;
      `);
      return { worker: name, mode: "atomic UPDATE Value = Value + 1" };
    } finally {
      await workerPool.close();
    }
  }

  const safeResults = await Promise.all([safeWorker("User A"), safeWorker("User B")]);
  const safeFinalValue = await readCounter(pool);
  console.table(safeResults);
  console.table([{ Test: "Lost Update safe", Expected: 2, ActualValue: safeFinalValue }]);

  if (safeFinalValue === 2) {
    pass("Lost Update safe xử lý đúng: atomic update/lock giúp kết quả cuối là 2.");
  } else {
    fail(`Lost Update safe sai kỳ vọng, giá trị cuối = ${safeFinalValue}.`);
  }
}

async function dirtyReadLab(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHẦN 3: Lab mô phỏng Dirty Read");
  console.log("============================================================\n");

  await resetCounter(pool, 100);

  const writerPool = await newPool();
  const readerPool = await newPool();
  const transaction = new sql.Transaction(writerPool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    await new sql.Request(transaction).query(`
      UPDATE __CC_Test_Counter
      SET Value = 999
      WHERE Id = 1;
    `);

    const dirtyRead = await readerPool.request().query(`
      SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
      SELECT Value FROM __CC_Test_Counter WHERE Id = 1;
      SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    `);

    await transaction.rollback();
    const finalValue = await readCounter(pool);

    const seenValue = Number(dirtyRead.recordset[0].Value);
    console.table([{ DirtyReadValue: seenValue, ValueAfterRollback: finalValue }]);

    if (seenValue === 999 && finalValue !== 999) {
      pass("Dirty Read đã được mô phỏng: User B thấy 999 dù User A rollback.");
      pass("ClinicCare tránh lỗi này vì procedure chính không dùng NOLOCK/READ UNCOMMITTED và SQL Server mặc định READ COMMITTED.");
    } else {
      warn("Dirty Read chưa tái hiện đúng trong lần chạy này.");
    }
  } catch (error) {
    await rollbackQuietly(transaction);
    throw error;
  } finally {
    await writerPool.close();
    await readerPool.close();
  }
}

async function nonRepeatableReadLab(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHẦN 4: Lab mô phỏng Non-repeatable Read");
  console.log("============================================================\n");

  await resetCounter(pool, 10);

  const readerPool = await newPool();
  const writerPool = await newPool();
  const transaction = new sql.Transaction(readerPool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    const txRequest = new sql.Request(transaction);
    const firstRead = await txRequest.query(`SELECT Value FROM __CC_Test_Counter WHERE Id = 1;`);
    const firstValue = Number(firstRead.recordset[0].Value);

    await writerPool.request().query(`
      UPDATE __CC_Test_Counter
      SET Value = 20
      WHERE Id = 1;
    `);

    const secondRead = await txRequest.query(`SELECT Value FROM __CC_Test_Counter WHERE Id = 1;`);
    const secondValue = Number(secondRead.recordset[0].Value);
    await transaction.commit();

    console.table([{ FirstRead: firstValue, SecondRead: secondValue }]);

    if (firstValue !== secondValue) {
      pass("Non-repeatable Read đã được mô phỏng: cùng transaction nhưng hai lần đọc khác nhau.");
      pass("ClinicCare giảm nguy cơ trong workflow ghi quan trọng bằng UPDLOCK/HOLDLOCK, nhưng chưa có giải pháp global toàn hệ thống.");
    } else {
      warn("Non-repeatable Read chưa tái hiện đúng trong lần chạy này.");
    }
  } catch (error) {
    await rollbackQuietly(transaction);
    throw error;
  } finally {
    await readerPool.close();
    await writerPool.close();
  }
}

async function phantomReadLab(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHẦN 5: Lab mô phỏng Phantom Read");
  console.log("============================================================\n");

  await resetAppointments(pool);

  const readerPool = await newPool();
  const writerPool = await newPool();
  const transaction = new sql.Transaction(readerPool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    const txRequest = new sql.Request(transaction);
    const firstCountResult = await txRequest.query(`
      SELECT COUNT(*) AS Total
      FROM __CC_Test_Appointments
      WHERE DoctorId = 101
        AND AppointmentDate = '2026-05-03'
        AND AppointmentTime = '10:00'
        AND Status <> 'Cancelled';
    `);
    const firstCount = Number(firstCountResult.recordset[0].Total);

    await writerPool.request().query(`
      INSERT INTO __CC_Test_Appointments (DoctorId, AppointmentDate, AppointmentTime, Status)
      VALUES (101, '2026-05-03', '10:00', 'Scheduled');
    `);

    const secondCountResult = await txRequest.query(`
      SELECT COUNT(*) AS Total
      FROM __CC_Test_Appointments
      WHERE DoctorId = 101
        AND AppointmentDate = '2026-05-03'
        AND AppointmentTime = '10:00'
        AND Status <> 'Cancelled';
    `);
    const secondCount = Number(secondCountResult.recordset[0].Total);
    await transaction.commit();

    console.table([{ FirstCount: firstCount, SecondCount: secondCount }]);

    if (secondCount > firstCount) {
      pass("Phantom Read đã được mô phỏng: cùng transaction nhưng số dòng tăng.");
      pass("ClinicCare xử lý tạo lịch hẹn bằng SERIALIZABLE + UPDLOCK + HOLDLOCK + unique index UX_Appointments_Doctor_Date_Time_Active.");
    } else {
      warn("Phantom Read chưa tái hiện đúng trong lần chạy này.");
    }
  } catch (error) {
    await rollbackQuietly(transaction);
    throw error;
  } finally {
    await readerPool.close();
    await writerPool.close();
  }
}

async function deadlockLab(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHẦN 6: Lab mô phỏng Deadlock");
  console.log("============================================================\n");

  await resetDeadlockTables(pool);

  async function transactionA() {
    const workerPool = await newPool();
    try {
      await workerPool.request().batch(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;
          UPDATE __CC_Test_DeadlockA SET Value = Value + 1 WHERE Id = 1;
          WAITFOR DELAY '00:00:02';
          UPDATE __CC_Test_DeadlockB SET Value = Value + 1 WHERE Id = 1;
        COMMIT TRANSACTION;
      `);
      return "Transaction A committed";
    } finally {
      await workerPool.close();
    }
  }

  async function transactionB() {
    const workerPool = await newPool();
    try {
      await workerPool.request().batch(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;
          UPDATE __CC_Test_DeadlockB SET Value = Value + 1 WHERE Id = 1;
          WAITFOR DELAY '00:00:02';
          UPDATE __CC_Test_DeadlockA SET Value = Value + 1 WHERE Id = 1;
        COMMIT TRANSACTION;
      `);
      return "Transaction B committed";
    } finally {
      await workerPool.close();
    }
  }

  const results = await Promise.allSettled([transactionA(), transactionB()]);
  const formatted = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return { Transaction: index === 0 ? "A" : "B", Status: "COMMITTED", Detail: result.value };
    }

    return {
      Transaction: index === 0 ? "A" : "B",
      Status: isDeadlockError(result.reason) ? "DEADLOCK VICTIM" : "FAILED",
      Detail: result.reason?.message || String(result.reason),
      ErrorNumber: result.reason?.number || result.reason?.originalError?.info?.number || null
    };
  });

  console.table(formatted);

  if (formatted.some((item) => item.Status === "DEADLOCK VICTIM")) {
    pass("Deadlock đã được mô phỏng, lỗi 1205. Một transaction bị SQL Server chọn làm victim.");
    pass("ClinicCare hiện có transaction ngắn, XACT_ABORT, UPDLOCK/HOLDLOCK/ROWLOCK để giảm nguy cơ deadlock, nhưng chưa có retry deadlock hoàn chỉnh trong stored procedure chính.");
  } else {
    warn("Deadlock chưa tái hiện đúng trong lần chạy này.");
  }
}

async function cleanupBusinessDemo(pool: sql.ConnectionPool, tag = "__CONCURRENCY_TEST__") {
  await pool.request().input("Tag", sql.NVarChar(80), tag).batch(`
    SET XACT_ABORT ON;

    BEGIN TRY
      BEGIN TRANSACTION;

      /*
        Cac bang nghiep vu quan trong co protection trigger chan DELETE cung.
        Vi vay cleanup business test dung soft cleanup: dua row demo ve trang thai inactive/cancelled/deleted.
        Tat ca dieu kien deu bam prefix @Tag, khong cham data nguoi dung that.
      */
      UPDATE a
      SET
        Status = 'Cancelled',
        CancelReason = ISNULL(CancelReason, N'Concurrency business test cleanup'),
        UpdatedAt = SYSDATETIME()
      FROM Appointments a
      WHERE a.Reason LIKE @Tag + '%'
         OR a.PatientId IN (SELECT PatientId FROM Patients WHERE LEFT(PatientCode, LEN(@Tag)) = @Tag);

      UPDATE pr
      SET Status = CASE WHEN Status = 'Pending' THEN 'Cancelled' ELSE Status END
      FROM Prescriptions pr
      WHERE pr.Note LIKE @Tag + '%';

      UPDATE i
      SET Status = CASE WHEN Status = 'Unpaid' THEN 'Cancelled' ELSE Status END
      FROM Invoices i
      INNER JOIN Patients p ON p.PatientId = i.PatientId
      WHERE LEFT(p.PatientCode, LEN(@Tag)) = @Tag;

      UPDATE ds
      SET IsActive = 0
      FROM DoctorSchedules ds
      WHERE ds.RoomId IN (SELECT RoomId FROM Rooms WHERE LEFT(RoomName, LEN(@Tag)) = @Tag)
         OR ds.DoctorId IN (
              SELECT d.DoctorId
              FROM Doctors d
              INNER JOIN Employees e ON e.EmployeeId = d.EmployeeId
              INNER JOIN Users u ON u.UserId = e.UserId
              WHERE LEFT(u.Username, LEN(@Tag)) = @Tag
            );

      UPDATE d
      SET IsActive = 0
      FROM Doctors d
      INNER JOIN Employees e ON e.EmployeeId = d.EmployeeId
      INNER JOIN Users u ON u.UserId = e.UserId
      WHERE LEFT(u.Username, LEN(@Tag)) = @Tag;

      UPDATE e
      SET IsActive = 0, IsDeleted = 1
      FROM Employees e
      INNER JOIN Users u ON u.UserId = e.UserId
      WHERE LEFT(u.Username, LEN(@Tag)) = @Tag;

      UPDATE u
      SET IsActive = 0, IsDeleted = 1, UpdatedAt = SYSDATETIME()
      FROM Users u
      WHERE LEFT(u.Username, LEN(@Tag)) = @Tag;

      UPDATE p
      SET IsDeleted = 1, UpdatedAt = SYSDATETIME()
      FROM Patients p
      WHERE LEFT(p.PatientCode, LEN(@Tag)) = @Tag;

      UPDATE m
      SET IsActive = 0, IsDeleted = 1, UpdatedAt = SYSDATETIME()
      FROM Medicines m
      WHERE LEFT(m.MedicineName, LEN(@Tag)) = @Tag;

      UPDATE r
      SET IsActive = 0
      FROM Rooms r
      WHERE LEFT(r.RoomName, LEN(@Tag)) = @Tag;

      UPDATE s
      SET IsActive = 0
      FROM Specialties s
      WHERE LEFT(s.SpecialtyName, LEN(@Tag)) = @Tag;

      COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
      IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
      THROW;
    END CATCH;
  `);
}

async function setupBusinessDemo(pool: sql.ConnectionPool): Promise<BusinessContext> {
  const tag = "__CONCURRENCY_TEST__";
  const suffix = String(Date.now()).slice(-10);
  const workDate = toDateOnly(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const appointmentTime = "10:00:00";

  await cleanupBusinessDemo(pool, tag);

  const result = await pool.request()
    .input("Tag", sql.NVarChar(80), tag)
    .input("Suffix", sql.NVarChar(20), suffix)
    .input("WorkDate", sql.Date, workDate)
    .batch(`
      SET XACT_ABORT ON;

      BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SpecialtyId INT;
        DECLARE @RoomId INT;
        DECLARE @DoctorUserId INT;
        DECLARE @ActorUserId INT;
        DECLARE @EmployeeId INT;
        DECLARE @DoctorId INT;
        DECLARE @PatientAId INT;
        DECLARE @PatientBId INT;
        DECLARE @DispensePatientId INT;
        DECLARE @PayPatientId INT;
        DECLARE @DispenseRecordId INT;
        DECLARE @PayRecordId INT;
        DECLARE @DispenseAppointmentId INT;
        DECLARE @PayAppointmentId INT;
        DECLARE @DispenseExamId INT;
        DECLARE @PayExamId INT;
        DECLARE @CategoryId INT;
        DECLARE @AdjustMedicineId INT;
        DECLARE @DispenseMedicineId INT;
        DECLARE @PrescriptionId INT;
        DECLARE @InvoiceId INT;
        DECLARE @InvoiceAmount DECIMAL(18,2) = 120000;

        INSERT INTO Specialties (SpecialtyName, Description, IsActive)
        VALUES (@Tag + N'Specialty ' + @Suffix, N'Demo concurrency specialty', 1);
        SET @SpecialtyId = SCOPE_IDENTITY();

        INSERT INTO Rooms (RoomName, RoomType, IsActive)
        VALUES (@Tag + N'Room ' + @Suffix, N'Consultation', 1);
        SET @RoomId = SCOPE_IDENTITY();

        INSERT INTO Users (Username, PasswordHash, FullName, Email, Phone, IsActive, IsDeleted)
        VALUES
          (@Tag + N'doctor_' + @Suffix, N'123456', N'Bac si Concurrency Demo', N'doctor.' + @Suffix + N'@cliniccare.demo', N'0901000001', 1, 0),
          (@Tag + N'actor_' + @Suffix, N'123456', N'Nhan vien Concurrency Demo', N'actor.' + @Suffix + N'@cliniccare.demo', N'0901000002', 1, 0);

        SELECT @DoctorUserId = UserId FROM Users WHERE Username = @Tag + N'doctor_' + @Suffix;
        SELECT @ActorUserId = UserId FROM Users WHERE Username = @Tag + N'actor_' + @Suffix;

        INSERT INTO Employees (UserId, EmployeeCode, Gender, DateOfBirth, Address, HireDate, IsActive, IsDeleted)
        VALUES (@DoctorUserId, N'CCTD' + @Suffix, N'Nam', '1988-03-12', N'ClinicCare demo address', CAST(SYSDATETIME() AS DATE), 1, 0);
        SET @EmployeeId = SCOPE_IDENTITY();

        INSERT INTO Doctors (EmployeeId, SpecialtyId, LicenseNumber, ExperienceYears, ConsultationFee, IsActive)
        VALUES (@EmployeeId, @SpecialtyId, N'CCTL' + @Suffix, 9, 150000, 1);
        SET @DoctorId = SCOPE_IDENTITY();

        INSERT INTO DoctorSchedules (DoctorId, RoomId, WorkDate, StartTime, EndTime, MaxPatients, IsActive)
        VALUES (@DoctorId, @RoomId, @WorkDate, '08:00', '12:00', 20, 1);

        INSERT INTO Patients
          (PatientCode, FullName, Gender, DateOfBirth, Phone, Email, Address, HealthInsuranceNumber, EmergencyContactName, EmergencyContactPhone, IsDeleted)
        VALUES
          (@Tag + N'A' + RIGHT(@Suffix, 9), N'Nguyen Test Hen A', N'Nam', '1992-02-02', N'0910000001', N'patient.a.' + @Suffix + N'@cliniccare.demo', N'Demo address A', N'BHYT-A-' + @Suffix, N'Nguoi nha A', N'0910000091', 0),
          (@Tag + N'B' + RIGHT(@Suffix, 9), N'Nguyen Test Hen B', N'Nu', '1993-03-03', N'0910000002', N'patient.b.' + @Suffix + N'@cliniccare.demo', N'Demo address B', N'BHYT-B-' + @Suffix, N'Nguoi nha B', N'0910000092', 0),
          (@Tag + N'D' + RIGHT(@Suffix, 9), N'Tran Test Cap Thuoc', N'Nam', '1990-04-04', N'0910000003', N'patient.dispense.' + @Suffix + N'@cliniccare.demo', N'Demo address C', N'BHYT-C-' + @Suffix, N'Nguoi nha C', N'0910000093', 0),
          (@Tag + N'P' + RIGHT(@Suffix, 9), N'Le Test Thanh Toan', N'Nu', '1991-05-05', N'0910000004', N'patient.pay.' + @Suffix + N'@cliniccare.demo', N'Demo address D', N'BHYT-D-' + @Suffix, N'Nguoi nha D', N'0910000094', 0);

        SELECT @PatientAId = PatientId FROM Patients WHERE PatientCode = @Tag + N'A' + RIGHT(@Suffix, 9);
        SELECT @PatientBId = PatientId FROM Patients WHERE PatientCode = @Tag + N'B' + RIGHT(@Suffix, 9);
        SELECT @DispensePatientId = PatientId FROM Patients WHERE PatientCode = @Tag + N'D' + RIGHT(@Suffix, 9);
        SELECT @PayPatientId = PatientId FROM Patients WHERE PatientCode = @Tag + N'P' + RIGHT(@Suffix, 9);

        INSERT INTO MedicalRecords (PatientId, RecordCode)
        VALUES
          (@DispensePatientId, N'CCTMRD' + @Suffix),
          (@PayPatientId, N'CCTMRP' + @Suffix);

        SELECT @DispenseRecordId = MedicalRecordId FROM MedicalRecords WHERE RecordCode = N'CCTMRD' + @Suffix;
        SELECT @PayRecordId = MedicalRecordId FROM MedicalRecords WHERE RecordCode = N'CCTMRP' + @Suffix;

        INSERT INTO Appointments (PatientId, DoctorId, RoomId, AppointmentDate, AppointmentTime, Reason, Status, CreatedBy)
        VALUES
          (@DispensePatientId, @DoctorId, @RoomId, @WorkDate, '09:00', @Tag + N'dispense prescription workflow', 'Completed', @ActorUserId),
          (@PayPatientId, @DoctorId, @RoomId, @WorkDate, '09:30', @Tag + N'pay invoice workflow', 'Completed', @ActorUserId);

        SELECT @DispenseAppointmentId = AppointmentId FROM Appointments WHERE PatientId = @DispensePatientId AND Reason = @Tag + N'dispense prescription workflow';
        SELECT @PayAppointmentId = AppointmentId FROM Appointments WHERE PatientId = @PayPatientId AND Reason = @Tag + N'pay invoice workflow';

        INSERT INTO Examinations (AppointmentId, MedicalRecordId, DoctorId, Symptoms, Diagnosis, Conclusion, Status, StartedAt, FinishedAt)
        VALUES
          (@DispenseAppointmentId, @DispenseRecordId, @DoctorId, N'Demo dau dau', N'Demo cam thuong', N'Demo cap thuoc', 'Completed', SYSDATETIME(), SYSDATETIME()),
          (@PayAppointmentId, @PayRecordId, @DoctorId, N'Demo kham tong quat', N'Suc khoe on dinh', N'Tao hoa don demo', 'Completed', SYSDATETIME(), SYSDATETIME());

        SELECT @DispenseExamId = ExaminationId FROM Examinations WHERE AppointmentId = @DispenseAppointmentId;
        SELECT @PayExamId = ExaminationId FROM Examinations WHERE AppointmentId = @PayAppointmentId;

        INSERT INTO MedicineCategories (CategoryName, Description)
        VALUES (@Tag + N'Medicine Category ' + @Suffix, N'Demo concurrency medicine category');
        SET @CategoryId = SCOPE_IDENTITY();

        INSERT INTO Medicines (CategoryId, MedicineName, Unit, Price, StockQuantity, MinStockQuantity, IsActive, IsDeleted)
        VALUES
          (@CategoryId, @Tag + N'Adjust Medicine ' + @Suffix, N'vien', 2000, 100, 10, 1, 0),
          (@CategoryId, @Tag + N'Dispense Medicine ' + @Suffix, N'vien', 3000, 20, 5, 1, 0);

        SELECT @AdjustMedicineId = MedicineId FROM Medicines WHERE MedicineName = @Tag + N'Adjust Medicine ' + @Suffix;
        SELECT @DispenseMedicineId = MedicineId FROM Medicines WHERE MedicineName = @Tag + N'Dispense Medicine ' + @Suffix;

        INSERT INTO Prescriptions (ExaminationId, DoctorId, Status, Note)
        VALUES (@DispenseExamId, @DoctorId, 'Pending', @Tag + N' prescription race ' + @Suffix);
        SET @PrescriptionId = SCOPE_IDENTITY();

        INSERT INTO PrescriptionDetails (PrescriptionId, MedicineId, Quantity, Dosage, UsageInstruction)
        VALUES (@PrescriptionId, @DispenseMedicineId, 5, N'1 vien/lần', N'Uong sau an');

        INSERT INTO Invoices (PatientId, ExaminationId, TotalAmount, Status, CreatedBy)
        VALUES (@PayPatientId, @PayExamId, @InvoiceAmount, 'Unpaid', @ActorUserId);
        SET @InvoiceId = SCOPE_IDENTITY();

        INSERT INTO InvoiceDetails (InvoiceId, ItemType, ItemId, Description, Quantity, UnitPrice)
        VALUES (@InvoiceId, 'Consultation', NULL, @Tag + N' consultation invoice detail', 1, @InvoiceAmount);

        COMMIT TRANSACTION;

        SELECT
          @DoctorUserId AS DoctorUserId,
          @ActorUserId AS ActorUserId,
          @DoctorId AS DoctorId,
          @RoomId AS RoomId,
          @PatientAId AS AppointmentPatientAId,
          @PatientBId AS AppointmentPatientBId,
          @AdjustMedicineId AS AdjustMedicineId,
          @DispenseMedicineId AS DispenseMedicineId,
          @PrescriptionId AS PrescriptionId,
          @InvoiceId AS InvoiceId,
          @InvoiceAmount AS InvoiceAmount;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `);

  const row = result.recordset[0];
  return {
    tag,
    suffix,
    workDate,
    appointmentTime,
    doctorUserId: Number(row.DoctorUserId),
    actorUserId: Number(row.ActorUserId),
    doctorId: Number(row.DoctorId),
    roomId: Number(row.RoomId),
    appointmentPatientAId: Number(row.AppointmentPatientAId),
    appointmentPatientBId: Number(row.AppointmentPatientBId),
    adjustMedicineId: Number(row.AdjustMedicineId),
    dispenseMedicineId: Number(row.DispenseMedicineId),
    prescriptionId: Number(row.PrescriptionId),
    invoiceId: Number(row.InvoiceId),
    invoiceAmount: Number(row.InvoiceAmount)
  };
}

async function executeBusinessCall<T>(name: string, action: (pool: sql.ConnectionPool) => Promise<T>) {
  const workerPool = await newPool();
  try {
    const value = await action(workerPool);
    return { name, ok: true, value };
  } catch (error) {
    return { name, ok: false, error: compactSqlError(error) };
  } finally {
    await workerPool.close();
  }
}

async function businessCreateAppointmentRace(pool: sql.ConnectionPool, ctx: BusinessContext) {
  console.log("\nBUSINESS 1: sp_CreateAppointment race");

  async function call(name: string, patientId: number) {
    return executeBusinessCall(name, async (workerPool) => {
      const result = await workerPool.request()
        .input("PatientId", sql.Int, patientId)
        .input("DoctorId", sql.Int, ctx.doctorId)
        .input("RoomId", sql.Int, ctx.roomId)
        .input("AppointmentDate", sql.Date, ctx.workDate)
        .input("AppointmentTime", sql.VarChar(8), ctx.appointmentTime)
        .input("Reason", sql.NVarChar(500), `${ctx.tag} appointment race ${ctx.suffix}`)
        .input("CreatedBy", sql.Int, ctx.actorUserId)
        .output("NewAppointmentId", sql.Int)
        .execute("dbo.sp_CreateAppointment");
      return { appointmentId: result.output.NewAppointmentId };
    });
  }

  const results = await Promise.all([
    call("Request A", ctx.appointmentPatientAId),
    call("Request B", ctx.appointmentPatientBId)
  ]);

  const activeCount = await pool.request()
    .input("DoctorId", sql.Int, ctx.doctorId)
    .input("RoomId", sql.Int, ctx.roomId)
    .input("AppointmentDate", sql.Date, ctx.workDate)
    .input("AppointmentTime", sql.VarChar(8), ctx.appointmentTime)
    .query(`
      SELECT COUNT(*) AS Total
      FROM Appointments
      WHERE DoctorId = @DoctorId
        AND RoomId = @RoomId
        AND AppointmentDate = @AppointmentDate
        AND AppointmentTime = @AppointmentTime
        AND Status NOT IN ('Cancelled', 'NoShow');
    `);

  const successCount = results.filter((item) => item.ok).length;
  console.table(results.map((item) => ({
    Request: item.name,
    Status: item.ok ? "SUCCESS" : "BLOCKED",
    Detail: item.ok ? JSON.stringify(item.value) : item.error
  })));

  if (successCount === 1 && Number(activeCount.recordset[0].Total) === 1) {
    pass("sp_CreateAppointment chan trung lich dung: 1 thanh cong, 1 that bai, database chi co 1 lich active.");
  } else {
    fail(`sp_CreateAppointment sai ky vong: success=${successCount}, active=${activeCount.recordset[0].Total}.`);
  }
}

async function businessAdjustMedicineStockRace(pool: sql.ConnectionPool, ctx: BusinessContext) {
  console.log("\nBUSINESS 2: sp_AdjustMedicineStock race");

  async function call(name: string) {
    return executeBusinessCall(name, async (workerPool) => {
      await workerPool.request()
        .input("MedicineId", sql.Int, ctx.adjustMedicineId)
        .input("Type", sql.NVarChar(20), "IN")
        .input("Quantity", sql.Int, 10)
        .input("Note", sql.NVarChar(500), `${ctx.tag} adjust stock race ${ctx.suffix}`)
        .input("CreatedBy", sql.Int, ctx.actorUserId)
        .execute("dbo.sp_AdjustMedicineStock");
      return { quantity: 10 };
    });
  }

  const results = await Promise.all([call("Request A"), call("Request B")]);
  const stock = await pool.request().input("MedicineId", sql.Int, ctx.adjustMedicineId).query(`
    SELECT StockQuantity
    FROM Medicines
    WHERE MedicineId = @MedicineId;
  `);

  const transactionCount = await pool.request()
    .input("MedicineId", sql.Int, ctx.adjustMedicineId)
    .input("Tag", sql.NVarChar(80), ctx.tag)
    .query(`
      SELECT COUNT(*) AS Total
      FROM InventoryTransactions
      WHERE MedicineId = @MedicineId
        AND TransactionType = 'IN'
        AND Note LIKE @Tag + '%';
    `);

  const successCount = results.filter((item) => item.ok).length;
  const finalStock = Number(stock.recordset[0].StockQuantity);
  console.table(results.map((item) => ({
    Request: item.name,
    Status: item.ok ? "SUCCESS" : "FAILED",
    Detail: item.ok ? JSON.stringify(item.value) : item.error
  })));
  console.table([{ InitialStock: 100, ExpectedFinalStock: 120, ActualFinalStock: finalStock, InTransactions: transactionCount.recordset[0].Total }]);

  if (successCount === 2 && finalStock === 120 && Number(transactionCount.recordset[0].Total) === 2) {
    pass("sp_AdjustMedicineStock xu ly dung: 2 lan nhap kho song song, ton kho cuoi = 120.");
  } else {
    fail(`sp_AdjustMedicineStock sai ky vong: success=${successCount}, finalStock=${finalStock}.`);
  }
}

async function businessDispenseMedicineRace(pool: sql.ConnectionPool, ctx: BusinessContext) {
  console.log("\nBUSINESS 3: sp_DispenseMedicine race");

  async function call(name: string) {
    return executeBusinessCall(name, async (workerPool) => {
      await workerPool.request()
        .input("PrescriptionId", sql.Int, ctx.prescriptionId)
        .input("DispensedBy", sql.Int, ctx.actorUserId)
        .execute("dbo.sp_DispenseMedicine");
      return { prescriptionId: ctx.prescriptionId };
    });
  }

  const results = await Promise.all([call("Request A"), call("Request B")]);
  const state = await pool.request()
    .input("PrescriptionId", sql.Int, ctx.prescriptionId)
    .input("MedicineId", sql.Int, ctx.dispenseMedicineId)
    .query(`
      SELECT
        (SELECT Status FROM Prescriptions WHERE PrescriptionId = @PrescriptionId) AS PrescriptionStatus,
        (SELECT StockQuantity FROM Medicines WHERE MedicineId = @MedicineId) AS StockQuantity,
        (
          SELECT COUNT(*)
          FROM InventoryTransactions
          WHERE MedicineId = @MedicineId
            AND TransactionType = 'OUT'
            AND ReferenceType = 'Prescription'
            AND ReferenceId = @PrescriptionId
        ) AS OutTransactions;
    `);

  const successCount = results.filter((item) => item.ok).length;
  const row = state.recordset[0];
  console.table(results.map((item) => ({
    Request: item.name,
    Status: item.ok ? "SUCCESS" : "BLOCKED",
    Detail: item.ok ? JSON.stringify(item.value) : item.error
  })));
  console.table([{ ExpectedStock: 15, ActualStock: row.StockQuantity, PrescriptionStatus: row.PrescriptionStatus, OutTransactions: row.OutTransactions }]);

  if (successCount === 1 && Number(row.StockQuantity) === 15 && Number(row.OutTransactions) === 1 && row.PrescriptionStatus === "Dispensed") {
    pass("sp_DispenseMedicine chan cap trung dung: chi tru kho 1 lan va don thuoc thanh Dispensed.");
  } else {
    fail(`sp_DispenseMedicine sai ky vong: success=${successCount}, stock=${row.StockQuantity}, out=${row.OutTransactions}.`);
  }
}

async function businessPayInvoiceRace(pool: sql.ConnectionPool, ctx: BusinessContext) {
  console.log("\nBUSINESS 4: sp_PayInvoice race");

  async function call(name: string) {
    return executeBusinessCall(name, async (workerPool) => {
      const result = await workerPool.request()
        .input("InvoiceId", sql.Int, ctx.invoiceId)
        .input("Amount", sql.Decimal(18, 2), ctx.invoiceAmount)
        .input("PaymentMethod", sql.NVarChar(50), "Cash")
        .input("PaidBy", sql.Int, ctx.actorUserId)
        .input("Note", sql.NVarChar(255), `${ctx.tag} pay invoice race ${ctx.suffix}`)
        .output("NewPaymentId", sql.Int)
        .execute("dbo.sp_PayInvoice");
      return { paymentId: result.output.NewPaymentId };
    });
  }

  const results = await Promise.all([call("Request A"), call("Request B")]);
  const state = await pool.request().input("InvoiceId", sql.Int, ctx.invoiceId).query(`
    SELECT
      (SELECT Status FROM Invoices WHERE InvoiceId = @InvoiceId) AS InvoiceStatus,
      (SELECT COUNT(*) FROM Payments WHERE InvoiceId = @InvoiceId) AS PaymentCount,
      (SELECT ISNULL(SUM(Amount), 0) FROM Payments WHERE InvoiceId = @InvoiceId) AS PaidAmount;
  `);

  const successCount = results.filter((item) => item.ok).length;
  const row = state.recordset[0];
  console.table(results.map((item) => ({
    Request: item.name,
    Status: item.ok ? "SUCCESS" : "BLOCKED",
    Detail: item.ok ? JSON.stringify(item.value) : item.error
  })));
  console.table([{ InvoiceStatus: row.InvoiceStatus, PaymentCount: row.PaymentCount, ExpectedPaidAmount: ctx.invoiceAmount, ActualPaidAmount: row.PaidAmount }]);

  if (successCount === 1 && row.InvoiceStatus === "Paid" && Number(row.PaymentCount) === 1 && Number(row.PaidAmount) === ctx.invoiceAmount) {
    pass("sp_PayInvoice chan thanh toan trung dung: chi co 1 payment hop le.");
  } else {
    fail(`sp_PayInvoice sai ky vong: success=${successCount}, payments=${row.PaymentCount}, status=${row.InvoiceStatus}.`);
  }
}

async function runBusiness(pool: sql.ConnectionPool) {
  console.log("\n============================================================");
  console.log("PHAN BUSINESS: Test stored procedure nghiep vu that bang du lieu demo rieng");
  console.log("============================================================\n");

  const ctx = await setupBusinessDemo(pool);
  console.log(`Demo prefix: ${ctx.tag}`);
  console.log(`Demo suffix: ${ctx.suffix}`);
  console.log(`Work date: ${ctx.workDate}`);

  try {
    await businessCreateAppointmentRace(pool, ctx);
    await businessAdjustMedicineStockRace(pool, ctx);
    await businessDispenseMedicineRace(pool, ctx);
    await businessPayInvoiceRace(pool, ctx);
  } finally {
    await cleanupBusinessDemo(pool, ctx.tag);
    pass("Da cleanup du lieu demo __CONCURRENCY_TEST__ sau business test.");
  }
}

async function runLabs(pool: sql.ConnectionPool) {
  await setupLabTables(pool);

  try {
    await lostUpdateLab(pool);
    await dirtyReadLab(pool);
    await nonRepeatableReadLab(pool);
    await phantomReadLab(pool);
    await deadlockLab(pool);
  } finally {
    // Reset dữ liệu lab để lần chạy sau bắt đầu từ trạng thái sạch.
    await resetCounter(pool, 0);
    await resetAppointments(pool);
    await resetDeadlockTables(pool);
  }
}

function parseMode(): RunMode {
  const args = new Set(process.argv.slice(2));
  if (args.has("--metadata")) return "metadata";
  if (args.has("--lab")) return "lab";
  if (args.has("--business")) return "business";
  if (args.has("--all")) return "all";
  return "all";
}

async function main() {
  const mode = parseMode();
  const pool = await newPool();

  try {
    console.log("ClinicCare Concurrency / Deadlock Test Tool");
    console.log(`Database: ${process.env.DB_DATABASE || "ClinicManagementDB"}`);
    console.log(`Mode: ${mode}`);

    if (mode === "metadata" || mode === "all") {
      await metadataCheck(pool);
    }

    if (mode === "lab" || mode === "all") {
      await runLabs(pool);
    }

    if (mode === "business" || mode === "all") {
      await runBusiness(pool);
    }

    console.log("\nHoàn tất concurrency/deadlock test.");
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  fail(error?.message || String(error));
  process.exitCode = 1;
});
