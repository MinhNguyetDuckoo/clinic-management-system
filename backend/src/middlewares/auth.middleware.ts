import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: number;
  username: string;
  roles: string[];
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Bạn chưa đăng nhập."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "clinic_secret_key_change_later"
    ) as AuthPayload;

    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn."
    });
  }
}