import { getDbPool, sql } from "../../config/database";
import { executeWithDeadlockRetry } from "../../utils/deadlockRetry";

type ColumnMap = Record<string, Set<string>>;

function hasColumn(schema: ColumnMap, tableName: string, columnName: string) {
  return schema[tableName]?.has(columnName) ?? false;
}

function countSql(tableName: string, where?: string) {
  return `(SELECT COUNT(*) FROM ${tableName}${where ? ` WHERE ${where}` : ""})`;
}

function selectExisting(columns: Set<string>, names: string[]) {
  return names.filter((name) => columns.has(name)).map((name) => `[${name}]`).join(", ");
}

function firstExisting(columns: Set<string>, names: string[]) {
  return names.find((name) => columns.has(name));
}

export class AdminRepository {
  private async getSchemaColumns(tableNames: string[]) {
    const pool = await getDbPool();
    const request = pool.request();
    request.input("TableNames", sql.NVarChar(sql.MAX), tableNames.join(","));

    const result = await request.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME IN (
        SELECT TRIM(value)
        FROM STRING_SPLIT(@TableNames, ',')
      )
      ORDER BY TABLE_NAME, ORDINAL_POSITION;
    `);

    return result.recordset.reduce((map: ColumnMap, row: any) => {
      if (!map[row.TABLE_NAME]) {
        map[row.TABLE_NAME] = new Set<string>();
      }
      map[row.TABLE_NAME].add(row.COLUMN_NAME);
      return map;
    }, {});
  }

  async getDashboardSummary() {
    const pool = await getDbPool();
    const schema = await this.getSchemaColumns([
      "Users",
      "Patients",
      "Doctors",
      "Roles",
      "AuditLogs",
      "LoginHistories",
      "Appointments",
      "Invoices",
      "Prescriptions"
    ]);
    const usersHasIsActive = hasColumn(schema, "Users", "IsActive");
    const usersHasIsDeleted = hasColumn(schema, "Users", "IsDeleted");
    const patientsHasIsDeleted = hasColumn(schema, "Patients", "IsDeleted");
    const doctorsHasIsDeleted = hasColumn(schema, "Doctors", "IsDeleted");
    const doctorsHasIsActive = hasColumn(schema, "Doctors", "IsActive");
    const loginDateColumn = hasColumn(schema, "LoginHistories", "LoginAt") ? "LoginAt" : null;

    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        ${usersHasIsActive ? countSql("Users", `IsActive = 1${usersHasIsDeleted ? " AND IsDeleted = 0" : ""}`) : "0"} AS activeUsers,
        ${usersHasIsActive ? countSql("Users", "IsActive = 0") : "0"} AS lockedUsers,
        ${usersHasIsDeleted ? countSql("Users", "IsDeleted = 1") : "0"} AS deletedUsers,
        (SELECT COUNT(*) FROM Roles) AS totalRoles,
        ${patientsHasIsDeleted ? countSql("Patients", "IsDeleted = 0") : countSql("Patients")} AS totalPatients,
        ${patientsHasIsDeleted ? countSql("Patients", "IsDeleted = 1") : "0"} AS totalPatientsDeleted,
        ${doctorsHasIsDeleted ? countSql("Doctors", "IsDeleted = 0") : countSql("Doctors")} AS totalDoctors,
        ${doctorsHasIsActive ? countSql("Doctors", `IsActive = 1${doctorsHasIsDeleted ? " AND IsDeleted = 0" : ""}`) : "0"} AS totalDoctorsActive,
        ${loginDateColumn ? countSql("LoginHistories", `CAST(${loginDateColumn} AS DATE) = CAST(GETDATE() AS DATE)`) : "0"} AS todayLogins,
        (SELECT COUNT(*) FROM AuditLogs) AS totalAuditLogs,
        (SELECT COUNT(*) FROM sys.tables) AS totalTables,
        (SELECT COUNT(*) FROM sys.procedures) AS totalStoredProcedures,
        (SELECT COUNT(*) FROM sys.views) AS totalViews,
        (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN', 'IF', 'TF')) AS totalFunctions,
        (SELECT COUNT(*) FROM sys.triggers) AS totalTriggers,
        (SELECT COUNT(*) FROM sys.foreign_keys) AS totalForeignKeys;
    `);
    return result.recordset[0];
  }

  async getPatients(filters: { status?: string; keyword?: string; limit?: number }) {
    const pool = await getDbPool();
    const schema = await this.getSchemaColumns(["Patients"]);
    const patientColumns = schema.Patients ?? new Set<string>();
    const insuranceColumn = firstExisting(patientColumns, ["InsuranceNumber", "HealthInsuranceNumber", "BHYTCode", "BHYT"]);
    const selectColumns = [
      "PatientId",
      "PatientCode",
      "FullName",
      "Gender",
      "DateOfBirth",
      "Phone",
      "Email",
      "Address",
      "InsuranceNumber",
      "EmergencyContactName",
      "EmergencyContactPhone",
      "IsDeleted",
      "CreatedAt",
      "UpdatedAt"
    ];
    const existingSelect = selectColumns
      .filter((column) => patientColumns.has(column))
      .map((column) => `[${column}]`)
      .join(", ");
    const bhytSelect = insuranceColumn ? `, [${insuranceColumn}] AS BHYT` : "";
    const status = filters.status === "active" || filters.status === "deleted" ? filters.status : "all";
    const limit = Math.min(Math.max(filters.limit || 100, 1), 500);
    const where: string[] = [];
    const searchableColumns = ["FullName", "PatientCode", "Phone"].filter((column) => patientColumns.has(column));
    const request = pool.request();
    request.input("Keyword", sql.NVarChar(255), filters.keyword || null);

    if (patientColumns.has("IsDeleted") && status !== "all") {
      where.push(`IsDeleted = ${status === "active" ? 0 : 1}`);
    }

    if (filters.keyword) {
      const textSearchConditions = searchableColumns.map((column) => `[${column}] LIKE '%' + @Keyword + '%'`);
      const numericKeyword = Number(filters.keyword);

      if (Number.isInteger(numericKeyword) && numericKeyword > 0 && patientColumns.has("PatientId")) {
        textSearchConditions.push("PatientId = @KeywordAsInt");
        request.input("KeywordAsInt", sql.Int, numericKeyword);
      }

      if (textSearchConditions.length > 0) {
        where.push(`(${textSearchConditions.join(" OR ")})`);
      }
    }

    const result = await request.query(`
      SELECT TOP (${limit})
        ${existingSelect || "*"}${bhytSelect}
      FROM Patients
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ${patientColumns.has("PatientId") ? "PatientId" : "1"} DESC;
    `);

    return result.recordset;
  }

  async getPatientDetail(patientId: number) {
    const pool = await getDbPool();
    const schema = await this.getSchemaColumns(["Patients", "Appointments", "Doctors", "Employees", "Users", "Rooms", "Examinations", "Invoices"]);
    const patientColumns = schema.Patients ?? new Set<string>();
    const appointmentColumns = schema.Appointments ?? new Set<string>();
    const doctorColumns = schema.Doctors ?? new Set<string>();
    const employeeColumns = schema.Employees ?? new Set<string>();
    const userColumns = schema.Users ?? new Set<string>();
    const roomColumns = schema.Rooms ?? new Set<string>();
    const examinationColumns = schema.Examinations ?? new Set<string>();
    const invoiceColumns = schema.Invoices ?? new Set<string>();
    const insuranceColumn = firstExisting(patientColumns, ["InsuranceNumber", "HealthInsuranceNumber", "BHYTCode", "BHYT"]);
    const patientSelect = selectExisting(patientColumns, [
      "PatientId",
      "PatientCode",
      "FullName",
      "Gender",
      "DateOfBirth",
      "Phone",
      "Email",
      "Address",
      "InsuranceNumber",
      "HealthInsuranceNumber",
      "BHYTCode",
      "BHYT",
      "EmergencyContactName",
      "EmergencyContactPhone",
      "IsDeleted",
      "CreatedAt",
      "UpdatedAt"
    ]);
    const patientResult = await pool.request().input("PatientId", sql.Int, patientId).query(`
      SELECT ${patientSelect || "*"}${insuranceColumn ? `, [${insuranceColumn}] AS BHYT` : ""}
      FROM Patients
      WHERE PatientId = @PatientId;
    `);
    const patient = patientResult.recordset[0];

    if (!patient) {
      return null;
    }

    const appointments = appointmentColumns.has("PatientId")
      ? (await pool.request().input("PatientId", sql.Int, patientId).query(`
          SELECT TOP 10
            a.AppointmentId,
            ${appointmentColumns.has("AppointmentDate") ? "a.AppointmentDate" : "NULL AS AppointmentDate"},
            ${appointmentColumns.has("AppointmentTime") ? "a.AppointmentTime" : "NULL AS AppointmentTime"},
            ${doctorColumns.has("EmployeeId") && employeeColumns.has("UserId") && userColumns.has("FullName") ? "u.FullName" : "NULL"} AS DoctorName,
            ${appointmentColumns.has("RoomId") && roomColumns.has("RoomName") ? "r.RoomName" : "NULL"} AS RoomName,
            ${appointmentColumns.has("Status") ? "a.Status" : "NULL AS Status"},
            ${appointmentColumns.has("Reason") ? "a.Reason" : "NULL AS Reason"}
          FROM Appointments a
          ${appointmentColumns.has("DoctorId") && doctorColumns.has("DoctorId") ? "LEFT JOIN Doctors d ON a.DoctorId = d.DoctorId" : ""}
          ${doctorColumns.has("EmployeeId") && employeeColumns.has("EmployeeId") ? "LEFT JOIN Employees e ON d.EmployeeId = e.EmployeeId" : ""}
          ${employeeColumns.has("UserId") && userColumns.has("UserId") ? "LEFT JOIN Users u ON e.UserId = u.UserId" : ""}
          ${appointmentColumns.has("RoomId") && roomColumns.has("RoomId") ? "LEFT JOIN Rooms r ON a.RoomId = r.RoomId" : ""}
          WHERE a.PatientId = @PatientId
          ORDER BY ${appointmentColumns.has("AppointmentDate") ? "a.AppointmentDate" : "a.AppointmentId"} DESC;
        `)).recordset
      : [];

    const examinations = examinationColumns.has("AppointmentId") && appointmentColumns.has("PatientId")
      ? (await pool.request().input("PatientId", sql.Int, patientId).query(`
          SELECT TOP 10
            e.ExaminationId,
            ${examinationColumns.has("Diagnosis") ? "e.Diagnosis" : "NULL AS Diagnosis"},
            ${examinationColumns.has("Conclusion") ? "e.Conclusion" : "NULL AS Conclusion"},
            ${examinationColumns.has("Status") ? "e.Status" : "NULL AS Status"},
            ${examinationColumns.has("StartedAt") ? "e.StartedAt" : "NULL AS StartedAt"},
            ${examinationColumns.has("FinishedAt") ? "e.FinishedAt" : "NULL AS FinishedAt"}
          FROM Examinations e
          JOIN Appointments a ON e.AppointmentId = a.AppointmentId
          WHERE a.PatientId = @PatientId
          ORDER BY ${examinationColumns.has("StartedAt") ? "e.StartedAt" : "e.ExaminationId"} DESC;
        `)).recordset
      : [];

    const invoices = invoiceColumns.has("PatientId") || (invoiceColumns.has("AppointmentId") && appointmentColumns.has("PatientId"))
      ? (await pool.request().input("PatientId", sql.Int, patientId).query(`
          SELECT TOP 10
            i.InvoiceId,
            ${invoiceColumns.has("TotalAmount") ? "i.TotalAmount" : invoiceColumns.has("Amount") ? "i.Amount AS TotalAmount" : "NULL AS TotalAmount"},
            ${invoiceColumns.has("Status") ? "i.Status" : "NULL AS Status"},
            ${invoiceColumns.has("CreatedAt") ? "i.CreatedAt" : "NULL AS CreatedAt"},
            ${invoiceColumns.has("PaidAt") ? "i.PaidAt" : "NULL AS PaidAt"}
          FROM Invoices i
          ${invoiceColumns.has("AppointmentId") && appointmentColumns.has("AppointmentId") ? "LEFT JOIN Appointments a ON i.AppointmentId = a.AppointmentId" : ""}
          WHERE ${invoiceColumns.has("PatientId") ? "i.PatientId = @PatientId" : "a.PatientId = @PatientId"}
          ORDER BY ${invoiceColumns.has("CreatedAt") ? "i.CreatedAt" : "i.InvoiceId"} DESC;
        `)).recordset
      : [];

    return { patient, appointments, examinations, invoices };
  }

  async getUsers() {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        u.UserId,
        u.Username,
        u.FullName,
        u.Email,
        u.Phone,
        u.IsActive,
        u.IsDeleted,
        u.CreatedAt,
        STRING_AGG(r.RoleName, ', ') AS RoleName,
        STRING_AGG(CAST(r.RoleId AS VARCHAR), ',') AS RoleId
      FROM Users u
      LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
      LEFT JOIN Roles r ON ur.RoleId = r.RoleId
      GROUP BY u.UserId, u.Username, u.FullName, u.Email, u.Phone, u.IsActive, u.IsDeleted, u.CreatedAt
      ORDER BY u.UserId DESC;
    `);
    return result.recordset;
  }

  async getRoles() {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT RoleId, RoleName, Description 
      FROM Roles
    `);
    return result.recordset;
  }

  async createUser(userData: any, adminId: number) {
    const { username, passwordHash, fullName, email, phone, roleId } = userData;
    return executeWithDeadlockRetry(async () => {
      const pool = await getDbPool();
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        const createRequest = transaction.request();
        createRequest.input("Username", sql.NVarChar(100), username);
        createRequest.input("PasswordHash", sql.NVarChar(255), passwordHash);
        createRequest.input("FullName", sql.NVarChar(150), fullName);
        createRequest.input("Email", sql.NVarChar(150), email || null);
        createRequest.input("Phone", sql.NVarChar(20), phone || null);
        createRequest.output("NewUserId", sql.Int);

        const createResult = await createRequest.execute("sp_CreateUser");
        const newUserId = createResult.output.NewUserId;

        // sp_CreateUser already writes an audit log. 
        // We add an extra one for ADMIN_CREATE_USER
        const auditRequest1 = transaction.request();
        await auditRequest1.query(`
          INSERT INTO AuditLogs (UserId, Action, TableName, RecordId, NewData)
          VALUES (${adminId}, 'ADMIN_CREATE_USER', 'Users', ${newUserId}, N'Created user: ${username}')
        `);

        // Assign role
        const roleCheckRequest = transaction.request();
        const roleResult = await roleCheckRequest.query(`SELECT RoleName FROM Roles WHERE RoleId = ${roleId}`);
        if (roleResult.recordset.length > 0) {
          const roleName = roleResult.recordset[0].RoleName;
          const assignRequest = transaction.request();
          assignRequest.input("UserId", sql.Int, newUserId);
          assignRequest.input("RoleName", sql.NVarChar(50), roleName);
          await assignRequest.execute("sp_AssignRole");
        }

        await transaction.commit();
        return { userId: newUserId };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  async changeRole(userId: number, roleId: number, adminId: number) {
    return executeWithDeadlockRetry(async () => {
      const pool = await getDbPool();
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        const validateRequest = transaction.request();
        const validateResult = await validateRequest.query(`
          SELECT 
            (SELECT COUNT(*) FROM Users WHERE UserId = ${userId}) AS UserExists,
            (SELECT COUNT(*) FROM Roles WHERE RoleId = ${roleId}) AS RoleExists
        `);

        if (validateResult.recordset[0].UserExists === 0) {
          throw new Error("User không tồn tại.");
        }
        if (validateResult.recordset[0].RoleExists === 0) {
          throw new Error("Role không tồn tại.");
        }

        const deleteRequest = transaction.request();
        await deleteRequest.query(`
          DELETE FROM UserRoles WITH (UPDLOCK, HOLDLOCK)
          WHERE UserId = ${userId}
        `);

        const insertRequest = transaction.request();
        await insertRequest.query(`
          INSERT INTO UserRoles (UserId, RoleId)
          VALUES (${userId}, ${roleId})
        `);

        const auditRequest = transaction.request();
        await auditRequest.query(`
          INSERT INTO AuditLogs (UserId, Action, TableName, RecordId, NewData)
          VALUES (${adminId}, 'ADMIN_CHANGE_ROLE', 'UserRoles', ${userId}, N'Changed to RoleId: ${roleId}')
        `);

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  async resetUserPassword(userId: number, passwordHash: string, adminId: number) {
    const pool = await getDbPool();
    const schema = await this.getSchemaColumns(["Users", "AuditLogs"]);
    const usersHasUpdatedAt = hasColumn(schema, "Users", "UpdatedAt");
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const userRequest = transaction.request();
      userRequest.input("UserId", sql.Int, userId);
      const userResult = await userRequest.query(`
        SELECT UserId, Username
        FROM Users
        WHERE UserId = @UserId;
      `);
      const user = userResult.recordset[0];

      if (!user) {
        throw new Error("User không tồn tại.");
      }

      const updateRequest = transaction.request();
      updateRequest.input("UserId", sql.Int, userId);
      updateRequest.input("PasswordHash", sql.NVarChar(255), passwordHash);
      await updateRequest.query(`
        UPDATE Users
        SET PasswordHash = @PasswordHash${usersHasUpdatedAt ? ", UpdatedAt = SYSDATETIME()" : ""}
        WHERE UserId = @UserId;
      `);

      const auditRequest = transaction.request();
      auditRequest.input("AdminId", sql.Int, adminId);
      auditRequest.input("RecordId", sql.Int, userId);
      auditRequest.input("NewData", sql.NVarChar(sql.MAX), `Admin reset password for user: ${user.Username}`);
      await auditRequest.query(`
        INSERT INTO AuditLogs (UserId, Action, TableName, RecordId, NewData)
        VALUES (@AdminId, 'ADMIN_RESET_PASSWORD', 'Users', @RecordId, @NewData);
      `);

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateUserStatus(userId: number, isActive: boolean, adminId: number) {
    const pool = await getDbPool();
    const action = isActive ? "ADMIN_UNLOCK_USER" : "ADMIN_LOCK_USER";
    const isActiveBit = isActive ? 1 : 0;
    
    await pool.request().query(`
      UPDATE Users SET IsActive = ${isActiveBit} WHERE UserId = ${userId};
      INSERT INTO AuditLogs (UserId, Action, TableName, RecordId, NewData)
      VALUES (${adminId}, '${action}', 'Users', ${userId}, N'Set IsActive = ${isActiveBit}');
    `);
    return true;
  }

  async softDeleteUser(userId: number, isDeleted: boolean, adminId: number) {
    const pool = await getDbPool();
    const action = isDeleted ? "ADMIN_SOFT_DELETE_USER" : "ADMIN_RESTORE_USER";
    const isDeletedBit = isDeleted ? 1 : 0;
    
    await pool.request().query(`
      UPDATE Users SET IsDeleted = ${isDeletedBit} WHERE UserId = ${userId};
      INSERT INTO AuditLogs (UserId, Action, TableName, RecordId, NewData)
      VALUES (${adminId}, '${action}', 'Users', ${userId}, N'Set IsDeleted = ${isDeletedBit}');
    `);
    return true;
  }

  async getLoginHistories() {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        h.LoginHistoryId,
        h.UserId,
        u.Username,
        u.FullName,
        h.LoginAt AS LoginTime,
        h.IpAddress
      FROM LoginHistories h
      JOIN Users u ON h.UserId = u.UserId
      ORDER BY h.LoginAt DESC
    `);
    return result.recordset;
  }

  async getAuditLogs(limit: number = 100) {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT TOP ${limit}
        a.AuditLogId,
        a.UserId,
        a.Action,
        a.TableName,
        a.RecordId,
        a.OldData,
        a.NewData,
        a.CreatedAt
      FROM AuditLogs a
      ORDER BY a.CreatedAt DESC
    `);
    return result.recordset;
  }

  async getDatabaseObjects() {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 'Tables' AS ObjectType, COUNT(*) AS Total FROM sys.tables
      UNION ALL
      SELECT 'Views', COUNT(*) FROM sys.views
      UNION ALL
      SELECT 'Stored Procedures', COUNT(*) FROM sys.procedures
      UNION ALL
      SELECT 'Functions', COUNT(*) FROM sys.objects WHERE type IN ('FN', 'IF', 'TF')
      UNION ALL
      SELECT 'Triggers', COUNT(*) FROM sys.triggers
      UNION ALL
      SELECT 'Foreign Keys', COUNT(*) FROM sys.foreign_keys
      UNION ALL
      SELECT 'Indexes', COUNT(*) FROM sys.indexes WHERE name IS NOT NULL
      UNION ALL
      SELECT 'Check Constraints', COUNT(*) FROM sys.check_constraints
      UNION ALL
      SELECT 'Default Constraints', COUNT(*) FROM sys.default_constraints;
    `);
    return result.recordset;
  }
}

export const adminRepository = new AdminRepository();
