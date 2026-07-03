export interface Review {
  id: string // Guid
  projectId: string // Guid
  reviewerId: number
  revieweeId: number
  rating: number
  comment: string | null
  createdAt: string
  reply: ReviewReply | null
}

export interface ReviewReply {
  id: string
  reviewId: string
  replierId: number
  content: string
  createdAt: string
}

export interface AverageRating {
  userId: number
  averageRating: number
  totalReviews: number
}
