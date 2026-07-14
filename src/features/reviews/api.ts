import { reviewApi } from "@/shared/api/client"
import type { Review, ReviewReply, AverageRating } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

// Review service dùng ID kiểu int (đồng bộ với Project sau migration Guid→int 2026-07-14).
// projectId chính là Project.Id (int) của Project service — KHÔNG map sang Guid nữa.

export interface CreateReviewInput {
  projectId: number
  reviewerId: number
  revieweeId: number
  rating: number
  comment?: string | null
}

export const createReview = async (input: CreateReviewInput) => {
  const response = await reviewApi.post<ApiResponse<Review>>("/reviews", input)
  return response.data?.data
}

export const getReviewsByProject = async (projectId: number) => {
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
  reviewId: number
  replierId: number
  content: string
}

export const createReply = async (input: CreateReplyInput) => {
  const response = await reviewApi.post<ApiResponse<ReviewReply>>("/replies", input)
  return response.data?.data
}
