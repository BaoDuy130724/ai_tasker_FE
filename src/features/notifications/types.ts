export interface Notification {
  id: number
  userId: number
  title: string
  message: string
  eventType: string
  actionUrl: string | null
  isRead: boolean
  createdAt: string
}
