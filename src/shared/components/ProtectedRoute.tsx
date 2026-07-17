import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"

interface ProtectedRouteProps {
  allowedRoles?: ("Client" | "Expert" | "Admin")[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { accessToken, refreshToken, user } = useAuthStore()

  // Sau F5: accessToken (chỉ ở memory) chưa có, nhưng còn refreshToken + user
  // -> bootstrap trong shared/api/client.ts đang gọi /auth/refresh. Chờ, đừng đá về /login.
  // Refresh xong: setAuth -> render tiếp; fail: clearAuth -> user = null -> redirect bên dưới.
  if (!accessToken && refreshToken && user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Đang khôi phục phiên đăng nhập...
      </div>
    )
  }

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
