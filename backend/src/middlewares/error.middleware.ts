import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

function getSqlErrorMessage(error: any): string | null {
  if (!error) return null;

  if (error.originalError?.info?.message) {
    return error.originalError.info.message;
  }

  if (error.precedingErrors?.[0]?.message) {
    return error.precedingErrors[0].message;
  }

  if (error.message) {
    return error.message;
  }

  return null;
}

export function errorMiddleware(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  const sqlMessage = getSqlErrorMessage(error);

  if (sqlMessage) {
    return res.status(400).json({
      success: false,
      message: sqlMessage
    });
  }

  return res.status(500).json({
    success: false,
    message: "Lỗi hệ thống."
  });
}