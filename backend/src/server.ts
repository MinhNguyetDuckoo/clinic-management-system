import dotenv from "dotenv";
import app from "./app";
import { getDbPool } from "./config/database";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await getDbPool();
    console.log("Connected to SQL Server");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();