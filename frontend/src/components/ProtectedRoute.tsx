import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../utils/authStorage";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
    const hasRole = user.roles.some((role: string) => 
      normalizedAllowedRoles.includes(role.toLowerCase())
    );
    if (!hasRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}