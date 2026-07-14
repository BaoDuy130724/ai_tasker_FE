export interface Review {
  id: number
  projectId: number
  reviewerId: number
  revieweeId: number
  rating: number
  comment: string | null
  createdAt: string
  reply: ReviewReply | null
}

export interface ReviewReply {
  id: number
  replierId: number
  content: string
  createdAt: string
}

export interface AverageRating {
  userId: number
  averageRating: number
  totalReviews: number
}
