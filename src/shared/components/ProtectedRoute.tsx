import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"

interface ProtectedRouteProps {
  allowedRoles?: ("Client" | "Expert" | "Admin")[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { accessToken, user } = useAuthStore()

  if (!accessToken || !user) {
    // Chưa đăng nhập -> redirect về login
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Không đúng role -> redirect về trang unauthorized hoặc dashboard tương ứng
    return <Navigate to={user.role === "Admin" ? "/admin/kpi" : "/dashboard"} replace />
  }

  return <Outlet />
}
