import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface User {
  id: string | number
  email: string
  fullName: string
  role: "Client" | "Expert" | "Admin"
}

// BE (AuthResultDto.User) trả `roles: string[]` — FE dùng `role` đơn.
// Mọi chỗ nhận user từ BE (login, refresh) PHẢI đi qua hàm này để store luôn một shape.
export const mapAuthUser = (authUser: {
  id: string | number
  email: string
  fullName: string
  roles?: string[]
}): User => ({
  id: authUser?.id,
  email: authUser?.email,
  fullName: authUser?.fullName,
  role:
    authUser?.roles && authUser.roles.length > 0
      ? (authUser.roles[0] as User["role"])
      : "Client",
})

interface AuthState {
  user: User | null
  // Chỉ sống trong memory — KHÔNG persist (giảm bề mặt XSS).
  // Sau F5 được khôi phục qua POST /auth/refresh (xem bootstrap trong shared/api/client.ts).
  accessToken: string | null
  // Persist để giữ đăng nhập sau F5. BE xoay vòng token này mỗi lần refresh.
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "ai-tasker-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
      // v0 từng persist cả accessToken — migrate gỡ nó khỏi localStorage của user cũ.
      version: 1,
      migrate: (persisted) => {
        if (persisted && typeof persisted === "object" && "accessToken" in persisted) {
          delete (persisted as Record<string, unknown>).accessToken
        }
        return persisted as Pick<AuthState, "user" | "refreshToken">
      },
    }
  )
)
