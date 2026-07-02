export const OrderStatus = {
  Pending: 0,
  InProgress: 1,
  Completed: 2,
  Cancelled: 3,
} as const

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus]

export interface Order {
  id: string
  serviceId: number
  serviceTitle: string
  clientId: number
  expertId: number
  price: number
  terms: string
  deadline: string
  status: OrderStatus
  statusName: string
  createdAt: string
}
