import axios from "axios"
import type { AxiosInstance } from "axios"
import { useAuthStore } from "@/features/auth/store"
// [MOCK] Lớp dữ liệu giả — xoá 3 dòng import + block "[MOCK]" bên dưới để gỡ hoàn toàn.
import { MOCK_ENABLED, attachMock, seedLocalMocks } from "@/mocks"

if (MOCK_ENABLED) seedLocalMocks()

const getBaseUrl = (service: string, useGateway: boolean) => {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5088"
  
  if (useGateway && service !== "file") {
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
        return import.meta.env.VITE_ADMIN_SERVICE_URL || "http://localhost:5007"
      default:
        return gatewayUrl
    }
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

  // Response Interceptor: Xử lý 401 & Refresh Token
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const accessToken = useAuthStore.getState().accessToken
          const refreshToken = useAuthStore.getState().refreshToken
          
          if (!refreshToken || !accessToken) {
            useAuthStore.getState().clearAuth()
            return Promise.reject(error)
          }

          const identityUrl = getBaseUrl("identity", useGateway)
          const refreshBaseUrl = isDirect ? `${identityUrl}/api` : identityUrl
          
          const refreshRes = await axios.post(`${refreshBaseUrl}/auth/refresh`, {
            accessToken,
            refreshToken,
          })

          // Giả định response trả về chứa data bọc theo chuẩn: ApiResponse<TokenDto>
          const tokenData = refreshRes.data?.data || refreshRes.data
          const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = tokenData
          
          useAuthStore.getState().setAuth(user, newAccessToken, newRefreshToken)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }
          return axios(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().clearAuth()
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
