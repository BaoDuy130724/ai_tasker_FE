export interface AiService {
  id: number
  expertId: number
  categoryId: number
  categoryName?: string
  title: string
  description: string
  price: number
  deliveryTimeDays: number
  coverImageUrl: string | null
  status: string // Draft | Published | Archived
  skills: string[]
  rating: number
  reviewsCount: number
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
