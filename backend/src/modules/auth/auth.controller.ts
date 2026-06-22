import { Request, Response } from "express";
import * as authService from "./auth.service";

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập username và password."
      });
    }

    const result = await authService.login({ username, password });

    return res.json({
      success: true,
      message: "Đăng nhập thành công.",
      data: result
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || "Đăng nhập thất bại."
    });
  }
}

export async function me(req: Request, res: Response) {
  return res.json({
    success: true,
    data: (req as any).user
  });
}