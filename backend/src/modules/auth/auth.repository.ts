import { getDbPool, sql } from "../../config/database";

export interface DbUser {
  UserId: number;
  Username: string;
  PasswordHash: string;
  FullName: string;
  Email: string | null;
  Phone: string | null;
  IsActive: boolean;
  IsDeleted: boolean;
  Roles: string | null;
}

export async function getUserByUsername(username: string): Promise<DbUser | null> {
  const pool = await getDbPool();

  const result = await pool
    .request()
    .input("Username", sql.NVarChar(100), username)
    .execute("dbo.sp_GetUserByUsername");

  return result.recordset[0] || null;
}