import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { getUserByUsername } from "./auth.repository";

interface LoginInput {
  username: string;
  password: string;
}

export async function login(input: LoginInput) {
  const user = await getUserByUsername(input.username);

  if (!user) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  if (!user.IsActive || user.IsDeleted) {
    throw new Error("Tài khoản đã bị khóa hoặc đã bị xóa.");
  }

  // Demo tạm thời.
  // Sau này sẽ đổi sang bcrypt.compare(input.password, user.PasswordHash)
  if (input.password !== user.PasswordHash) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  const roles = user.Roles ? user.Roles.split(",") : [];

  const jwtOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"]
  };

  const token = jwt.sign(
    {
      userId: user.UserId,
      username: user.Username,
      roles
    },
    process.env.JWT_SECRET || "clinic_secret_key_change_later",
    jwtOptions
  );

  return {
    token,
    user: {
      userId: user.UserId,
      username: user.Username,
      fullName: user.FullName,
      email: user.Email,
      phone: user.Phone,
      roles
    }
  };
}
