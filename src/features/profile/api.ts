import { profileApi } from "@/shared/api/client"
import type { UserProfile, Skill } from "./types"

// Lưu ý: Profile service trả DTO trực tiếp (KHÔNG bọc trong ApiResponse<T> như
// Job/Project/Marketplace) — xem AITasker.Profile.Api/Controllers/ProfilesController.cs.

export const getMyProfile = async () => {
  const response = await profileApi.get<UserProfile>("/Profiles/me")
  return response.data
}

export const getProfileByUserId = async (userId: number) => {
  const response = await profileApi.get<UserProfile>(`/Profiles/${userId}`)
  return response.data
}

export interface UpdateProfileInput {
  fullName: string
  title: string
  bio: string
}

export const updateProfile = async (input: UpdateProfileInput) => {
  const response = await profileApi.put("/Profiles/me", input)
  return response.data
}

export const uploadAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  // Bỏ Content-Type mặc định "application/json" của instance để browser tự set
  // đúng multipart boundary — bắt buộc, không được set cứng "multipart/form-data".
  const response = await profileApi.post<{ avatarUrl: string; message: string }>(
    "/Profiles/me/avatar",
    formData,
    { headers: { "Content-Type": undefined } }
  )
  return response.data
}

export interface CreatePortfolioItemInput {
  title: string
  description: string
  link: string
  imageUrl: string
}

export const addPortfolioItem = async (input: CreatePortfolioItemInput) => {
  const response = await profileApi.post("/Profiles/me/portfolio", input)
  return response.data
}

export const deletePortfolioItem = async (id: string) => {
  const response = await profileApi.delete(`/Profiles/me/portfolio/${id}`)
  return response.data
}

export const addSkillToProfile = async (skillId: string) => {
  const response = await profileApi.post(`/Profiles/me/skills/${skillId}`)
  return response.data
}

export interface CreateCertificateInput {
  name: string
  fileUrl: string
  issuedBy: string
  issueDate: string
}

export const addCertificate = async (input: CreateCertificateInput) => {
  const response = await profileApi.post("/Profiles/me/certificates", input)
  return response.data
}

export const getAllSkills = async () => {
  const response = await profileApi.get<Skill[]>("/Skills")
  return response.data || []
}
