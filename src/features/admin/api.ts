import { adminApi, profileApi } from "@/shared/api/client"
import type { AdminUser, Certificate, DashboardKpi } from "./types"
import type { ApiResponse, PagedResult } from "@/features/jobs/api"

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

// Certificate APIs (gọi qua profile service!)
export const getPendingCertificates = async () => {
  const response = await profileApi.get<Certificate[]>("/AdminCertificates")
  return response.data || []
}

export const approveCertificate = async (id: string) => {
  const response = await profileApi.put<any>(`/AdminCertificates/${id}/approve`)
  return response.data
}

export const rejectCertificate = async (id: string) => {
  const response = await profileApi.put<any>(`/AdminCertificates/${id}/reject`)
  return response.data
}
