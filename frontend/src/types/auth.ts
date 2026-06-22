export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}