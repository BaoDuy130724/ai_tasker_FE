import { profileApi } from "@/shared/api/client"
import type { UserProfile, Skill } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

// Từ 2026-07-17 (BE chuẩn hóa API Response — docs/API_RESPONSE_STANDARD.md):
// Profile service bọc MỌI response trong ApiResponse<T> { success, statusCode, message, data }
// và yêu cầu JWT ([Authorize]) cho mọi endpoint trừ GET /Profiles/{userId} và GET /Skills.

export const getMyProfile = async () => {
  const response = await profileApi.get<ApiResponse<UserProfile>>("/Profiles/me")
  return response.data?.data
}

export const getProfileByUserId = async (userId: number) => {
  const response = await profileApi.get<ApiResponse<UserProfile>>(`/Profiles/${userId}`)
  return response.data?.data
}

export interface UpdateProfileInput {
  fullName: string
  title: string
  bio: string
}

export const updateProfile = async (input: UpdateProfileInput) => {
  // BE trả data: null, message nằm ở envelope — trả envelope để caller đọc .message nếu cần.
  const response = await profileApi.put<ApiResponse<null>>("/Profiles/me", input)
  return response.data
}

export const uploadAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  // Bỏ Content-Type mặc định "application/json" của instance để browser tự set
  // đúng multipart boundary — bắt buộc, không được set cứng "multipart/form-data".
  const response = await profileApi.post<ApiResponse<{ avatarUrl: string }>>(
    "/Profiles/me/avatar",
    formData,
    { headers: { "Content-Type": undefined } }
  )
  // Giữ shape cũ { avatarUrl, message } cho caller: avatarUrl giờ nằm trong data.
  return { avatarUrl: response.data?.data?.avatarUrl, message: response.data?.message }
}

export interface CreatePortfolioItemInput {
  title: string
  description: string
  link: string
  imageUrl: string
}

export const addPortfolioItem = async (input: CreatePortfolioItemInput) => {
  const response = await profileApi.post<ApiResponse<null>>("/Profiles/me/portfolio", input)
  return response.data
}

export const deletePortfolioItem = async (id: number) => {
  const response = await profileApi.delete<ApiResponse<null>>(`/Profiles/me/portfolio/${id}`)
  return response.data
}

export const addSkillToProfile = async (skillId: number) => {
  const response = await profileApi.post<ApiResponse<null>>(`/Profiles/me/skills/${skillId}`)
  return response.data
}

export interface CreateCertificateInput {
  name: string
  fileUrl: string
  issuedBy: string
  issueDate: string
}

export const addCertificate = async (input: CreateCertificateInput) => {
  const response = await profileApi.post<ApiResponse<null>>("/Profiles/me/certificates", input)
  return response.data
}

export const getAllSkills = async () => {
  const response = await profileApi.get<ApiResponse<Skill[]>>("/Skills")
  return response.data?.data || []
}
