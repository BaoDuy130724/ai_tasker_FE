export interface AiService {
  id: number
  expertId: number
  // BE điền qua gRPC Profile (có thể là mặc định nếu Profile lỗi).
  expertName?: string
  expertAvatarUrl?: string | null
  categoryId: number
  categoryName?: string
  title: string
  description: string
  price: number
  deliveryTimeDays: number
  coverImageUrl: string | null
  status: string // Draft | Published | Archived
  skills: string[]
  // BE AiServiceDto dùng averageRating/totalReviews (KHÔNG phải rating/reviewsCount).
  averageRating: number
  totalReviews: number
  createdAt: string
  updatedAt: string | null
}

export interface Category {
  id: number
  name: string
  description: string | null
  parentId: number | null
}

export interface Favorite {
  id: number
  clientId: number
  serviceId: number
  createdAt: string
  service: AiService
}
