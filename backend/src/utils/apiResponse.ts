import { Response } from "express";

export function successResponse(
  res: Response,
  data: any = null,
  message = "Thành công.",
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function errorResponse(
  res: Response,
  message = "Có lỗi xảy ra.",
  statusCode = 500,
  error: any = null
) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error : undefined
  });
}