import type { Order } from "./types"
import { OrderStatus } from "./types"

const STORAGE_KEY = "ai_tasker_mock_orders"

const getRawOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

const saveRawOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

export const orderStore = {
  getOrders: (): Order[] => {
    return getRawOrders()
  },

  createOrder: (input: Omit<Order, "id" | "status" | "statusName" | "createdAt">): Order => {
    const orders = getRawOrders()
    const newOrder: Order = {
      ...input,
      id: "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      status: OrderStatus.Pending,
      statusName: "Pending",
      createdAt: new Date().toISOString(),
    }
    orders.push(newOrder)
    saveRawOrders(orders)
    return newOrder
  },

  updateOrderStatus: (id: string, status: OrderStatus): boolean => {
    const orders = getRawOrders()
    const index = orders.findIndex((o) => o.id === id)
    if (index !== -1) {
      orders[index].status = status
      orders[index].statusName = status === OrderStatus.Pending 
        ? "Pending" 
        : status === OrderStatus.InProgress 
        ? "In Progress" 
        : status === OrderStatus.Completed 
        ? "Completed" 
        : "Cancelled"
      saveRawOrders(orders)
      return true
    }
    return false
  },

  getOrdersByClient: (clientId: number): Order[] => {
    return getRawOrders().filter((o) => o.clientId === clientId)
  },

  getOrdersByExpert: (expertId: number): Order[] => {
    return getRawOrders().filter((o) => o.expertId === expertId)
  }
}
