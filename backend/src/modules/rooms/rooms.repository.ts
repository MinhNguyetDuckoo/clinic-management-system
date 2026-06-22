import { getDbPool } from "../../config/database";

export async function getActiveRooms() {
  const pool = await getDbPool();

  const result = await pool.request().query(`
    SELECT
      RoomId,
      RoomName,
      RoomType
    FROM Rooms
    WHERE IsActive = 1
    ORDER BY RoomName
  `);

  return result.recordset;
}
