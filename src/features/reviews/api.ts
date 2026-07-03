import { reviewApi } from "@/shared/api/client"
import type { Review, ReviewReply, AverageRating } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

export const intToGuid = (id: number): string => {
  const hex = id.toString(16).padStart(12, "0")
  return `00000000-0000-0000-0000-${hex}`
}

export interface CreateReviewInput {
  projectId: string // Guid
  reviewerId: number
  revieweeId: number
  rating: number
  comment?: string | null
}

export const createReview = async (input: CreateReviewInput) => {
  const response = await reviewApi.post<ApiResponse<Review>>("/reviews", input)
  return response.data?.data
}

export const getReviewsByProject = async (projectId: string) => {
  const response = await reviewApi.get<ApiResponse<Review[]>>(`/reviews/project/${projectId}`)
  return response.data?.data || []
}

export const getReviewsByUser = async (userId: number) => {
  const response = await reviewApi.get<ApiResponse<Review[]>>(`/reviews/user/${userId}`)
  return response.data?.data || []
}

export const getAverageRating = async (userId: number) => {
  const response = await reviewApi.get<ApiResponse<AverageRating>>(`/reviews/user/${userId}/rating`)
  return response.data?.data
}

export interface CreateReplyInput {
  reviewId: string // Guid
  replierId: number
  content: string
}

export const createReply = async (input: CreateReplyInput) => {
  const response = await reviewApi.post<ApiResponse<ReviewReply>>("/replies", input)
  return response.data?.data
}
