import { NextFunction, Request, Response } from "express";

export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập."
      });
    }

    const lowerAllowedRoles = allowedRoles.map(r => r.toLowerCase());
    const hasRole = user.roles?.some((role: string) =>
      lowerAllowedRoles.includes(role.toLowerCase())
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập."
      });
    }

    return next();
  };
}