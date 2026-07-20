import { adminApi, profileApi } from "@/shared/api/client"
import type { AdminUser, AdminJob, AdminService, Certificate, DashboardKpi } from "./types"
import type { ApiResponse, PagedResult } from "@/features/jobs/api"

// Lưu ý: PagedResult<T> thật của Admin chỉ có { items, totalCount } (không có page/pageSize/totalPages
// như PagedResult dùng chung ở jobs/api.ts) — khai báo type riêng cho đúng response thật.
interface AdminPagedResult<T> {
  items: T[]
  totalCount: number
}

export interface GetUsersParams {
  keyword?: string
  role?: string
  page?: number
  pageSize?: number
}

export const getUsers = async (params: GetUsersParams) => {
  const response = await adminApi.get<ApiResponse<PagedResult<AdminUser>>>("/admin/users", { params })
  return response.data?.data
}

export const lockUser = async (id: number, isLocked: boolean) => {
  const response = await adminApi.put<ApiResponse<any>>(`/admin/users/${id}/lock`, { isLocked })
  return response.data?.data
}

export const getDashboardKpi = async () => {
  const response = await adminApi.get<ApiResponse<DashboardKpi>>("/admin/dashboard")
  return response.data?.data
}

export const refreshDashboardKpi = async () => {
  const response = await adminApi.post<ApiResponse<any>>("/admin/dashboard/refresh")
  return response.data?.data
}

// Jobs management — Admin BE gọi gRPC sang Job service (JobAdminService, port 5104).
// ✅ gRPC đã BẬT và test round-trip (PROJECT_CONTEXT mục 10, 2026-07-17). Cần Job service
// đang chạy; lưu ý GetJobs phía BE bỏ qua tham số keyword (query chỉ lọc theo Skill).
export interface GetAdminJobsParams {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}

export const getAdminJobs = async (params: GetAdminJobsParams) => {
  const response = await adminApi.get<ApiResponse<AdminPagedResult<AdminJob>>>("/admin/jobs", { params })
  return response.data?.data
}

export const removeAdminJob = async (id: number, reason: string) => {
  const response = await adminApi.delete<ApiResponse<any>>(`/admin/jobs/${id}`, { data: { reason } })
  return response.data?.data
}

// Services management — gRPC sang Marketplace (MarketplaceAdminService, port 5254) ✅ đã bật.
export interface GetAdminServicesParams {
  keyword?: string
  page?: number
  pageSize?: number
}

export const getAdminServices = async (params: GetAdminServicesParams) => {
  const response = await adminApi.get<ApiResponse<AdminPagedResult<AdminService>>>("/admin/services", { params })
  return response.data?.data
}

export const removeAdminService = async (id: number, reason: string) => {
  const response = await adminApi.delete<ApiResponse<any>>(`/admin/services/${id}`, { data: { reason } })
  return response.data?.data
}

// Certificate APIs (gọi qua profile service!)
// Từ 2026-07-17: AdminCertificatesController bọc ApiResponse<T> + yêu cầu JWT role Admin
// ([Authorize(Roles = "Admin")]) — token của user thường sẽ bị 403.
export const getPendingCertificates = async () => {
  const response = await profileApi.get<ApiResponse<Certificate[]>>("/AdminCertificates")
  return response.data?.data || []
}

export const approveCertificate = async (id: number) => {
  const response = await profileApi.put<ApiResponse<null>>(`/AdminCertificates/${id}/approve`)
  return response.data
}

export const rejectCertificate = async (id: number) => {
  const response = await profileApi.put<ApiResponse<null>>(`/AdminCertificates/${id}/reject`)
  return response.data
}
