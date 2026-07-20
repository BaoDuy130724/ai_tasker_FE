import axios from "axios"
import type { AxiosInstance } from "axios"
import { useAuthStore, mapAuthUser } from "@/features/auth/store"
// [MOCK] Lớp dữ liệu giả — xoá 3 dòng import + block "[MOCK]" bên dưới để gỡ hoàn toàn.
import { MOCK_ENABLED, attachMock, seedLocalMocks } from "@/mocks"

if (MOCK_ENABLED) seedLocalMocks()

const getBaseUrl = (service: string, useGateway: boolean) => {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5088"
  
  if (useGateway && service !== "file") {
    // Gateway `admin-route` KHÔNG có transform PathRemovePrefix (forward nguyên path
    // `/api/admin/**` xuống Admin service) — khác 9 route còn lại. Các path trong
    // features/admin/api.ts đã bắt đầu bằng "/admin/..." nên KHÔNG được ghép thêm
    // segment "admin" vào base, nếu không URL thành /api/admin/admin/* → 404.
    // (Verify live 2026-07-20: /api/admin/users → 200, /api/admin/admin/users → 404.)
    if (service === "admin") return `${gatewayUrl}/api`
    return `${gatewayUrl}/api/${service}`
  } else {
    switch (service) {
      case "identity":
        return import.meta.env.VITE_IDENTITY_SERVICE_URL || "http://localhost:5285"
      case "profile":
        return import.meta.env.VITE_PROFILE_SERVICE_URL || "http://localhost:5138"
      case "job":
        return import.meta.env.VITE_JOB_SERVICE_URL || "http://localhost:5103"
      case "project":
        return import.meta.env.VITE_PROJECT_SERVICE_URL || "http://localhost:5003"
      case "marketplace":
        return import.meta.env.VITE_MARKETPLACE_SERVICE_URL || "http://localhost:5253"
      case "review":
        return import.meta.env.VITE_REVIEW_SERVICE_URL || "http://localhost:5290"
      case "notification":
        return import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://localhost:5295"
      case "messaging":
        return import.meta.env.VITE_MESSAGING_SERVICE_URL || "http://localhost:5200"
      case "ai":
        return import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:5092"
      case "file":
        return import.meta.env.VITE_FILE_SERVICE_URL || "http://localhost:5110"
      case "admin":
        return import.meta.env.VITE_ADMIN_SERVICE_URL || "http://localhost:5030"
      default:
        return gatewayUrl
    }
  }
}

// ---------------------------------------------------------------------------
// Refresh phiên đăng nhập — SINGLE-FLIGHT.
// BE xoay vòng refresh token (revoke cũ ngay khi dùng — RefreshHandler), nên tuyệt
// đối không gọi /auth/refresh song song: request thứ hai sẽ dùng token đã revoke
// và văng đăng nhập. Mọi lời gọi trong lúc đang refresh đều chờ chung 1 promise.
// ---------------------------------------------------------------------------
let refreshInFlight: Promise<string> | null = null

export const refreshSession = (): Promise<string> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

const doRefresh = async (): Promise<string> => {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    useAuthStore.getState().clearAuth()
    throw new Error("Không có refresh token")
  }

  const useGateway = import.meta.env.VITE_USE_GATEWAY === "true"
  const identityUrl = getBaseUrl("identity", useGateway)
  const refreshBaseUrl = useGateway ? identityUrl : `${identityUrl}/api`

  try {
    // BE (RefreshCommand) chỉ cần refreshToken — không gửi accessToken cũ.
    const refreshRes = await axios.post(`${refreshBaseUrl}/auth/refresh`, {
      refreshToken,
    })

    // Response bọc chuẩn ApiResponse<AuthResultDto>
    const tokenData = refreshRes.data?.data || refreshRes.data
    const { accessToken, refreshToken: newRefreshToken, user } = tokenData

    useAuthStore.getState().setAuth(mapAuthUser(user), accessToken, newRefreshToken)
    return accessToken
  } catch (err) {
    // Refresh token hết hạn / bị revoke → coi như phiên kết thúc.
    useAuthStore.getState().clearAuth()
    throw err
  }
}

const createServiceInstance = (service: string): AxiosInstance => {
  const useGateway = import.meta.env.VITE_USE_GATEWAY === "true"
  const base = getBaseUrl(service, useGateway)
  const isDirect = !useGateway || service === "file"
  const baseURL = isDirect ? `${base}/api` : base

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Request Interceptor: Gắn Bearer Token
  instance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().accessToken
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // [MOCK] Bật dữ liệu giả cho mọi service trừ identity (dễ gỡ: xoá block này).
  if (MOCK_ENABLED && service !== "identity") {
    attachMock(instance, service)
  }

  // Response Interceptor: Xử lý 401 & Refresh Token (single-flight — xem refreshSession)
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true

        if (!useAuthStore.getState().refreshToken) {
          useAuthStore.getState().clearAuth()
          return Promise.reject(error)
        }

        try {
          const newAccessToken = await refreshSession()
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }
          return axios(originalRequest)
        } catch (refreshError) {
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}

export const identityApi = createServiceInstance("identity")
export const profileApi = createServiceInstance("profile")
export const jobApi = createServiceInstance("job")
export const projectApi = createServiceInstance("project")
export const marketplaceApi = createServiceInstance("marketplace")
export const reviewApi = createServiceInstance("review")
export const notificationApi = createServiceInstance("notification")
export const messagingApi = createServiceInstance("messaging")
export const aiApi = createServiceInstance("ai")
export const fileApi = createServiceInstance("file")
export const adminApi = createServiceInstance("admin")

// ---------------------------------------------------------------------------
// Bootstrap khôi phục phiên sau F5.
// accessToken chỉ sống trong memory (không persist — xem features/auth/store.ts),
// nên khi tải lại trang phải đổi refreshToken (persist) lấy accessToken mới.
// Chạy ở module scope để kịp trước mọi effect của component; nếu refresh fail
// thì doRefresh đã clearAuth → ProtectedRoute tự đưa user về /login.
// ---------------------------------------------------------------------------
{
  const { accessToken, refreshToken } = useAuthStore.getState()
  if (!accessToken && refreshToken) {
    refreshSession().catch(() => {
      /* phiên hết hạn — đã clearAuth trong doRefresh */
    })
  }
}
