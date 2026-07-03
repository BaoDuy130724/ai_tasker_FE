import { marketplaceApi } from "@/shared/api/client"
import type { AiService, Category, Favorite } from "./types"
import type { ApiResponse } from "@/features/jobs/api"
import type { PagedResult } from "@/features/jobs/api"

export interface GetServicesParams {
  searchTerm?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: string
  isDescending?: boolean
  pageIndex?: number
  pageSize?: number
}

export const getServices = async (params: GetServicesParams) => {
  const response = await marketplaceApi.get<PagedResult<AiService>>("/services", { params })
  return response.data?.items ? response.data : (response.data as any)?.data
}

export const getServiceById = async (id: number) => {
  const response = await marketplaceApi.get<ApiResponse<AiService>>(`/services/${id}`)
  return response.data?.data
}

export interface CreateAiServiceInput {
  categoryId: number
  title: string
  description: string
  price: number
  deliveryTimeDays: number
  coverImageUrl?: string | null
  skills: string[]
}

export const createService = async (input: CreateAiServiceInput) => {
  const response = await marketplaceApi.post<ApiResponse<AiService>>("/services", input)
  return response.data?.data
}

export interface UpdateAiServiceInput {
  categoryId: number
  title: string
  description: string
  price: number
  deliveryTimeDays: number
  coverImageUrl?: string | null
  status: string
  skills: string[]
}

export const updateService = async (id: number, input: UpdateAiServiceInput) => {
  const response = await marketplaceApi.put<ApiResponse<AiService>>(`/services/${id}`, input)
  return response.data?.data
}

export const deleteService = async (id: number) => {
  const response = await marketplaceApi.delete<ApiResponse<any>>(`/services/${id}`)
  return response.data?.data
}

export const getCategories = async () => {
  const response = await marketplaceApi.get<Category[]>("/categories")
  return response.data || []
}

// Favorites APIs
export const getFavorites = async () => {
  const response = await marketplaceApi.get<ApiResponse<Favorite[]>>("/favorites")
  return response.data?.data || []
}

export const addFavorite = async (serviceId: number) => {
  const response = await marketplaceApi.post<ApiResponse<Favorite>>("/favorites", { serviceId })
  return response.data?.data
}

export const removeFavorite = async (serviceId: number) => {
  const response = await marketplaceApi.delete<ApiResponse<boolean>>(`/favorites/${serviceId}`)
  return response.data?.data
}
