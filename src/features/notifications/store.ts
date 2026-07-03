import { create } from "zustand"
import * as signalR from "@microsoft/signalr"
import { notificationApi } from "@/shared/api/client"
import type { Notification } from "./types"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  connection: signalR.HubConnection | null
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  startSignalR: (token: string) => void
  stopSignalR: () => void
}

const getHubUrl = () => {
  const useGateway = import.meta.env.VITE_USE_GATEWAY === "true"
  if (useGateway) {
    // Gateway YARP route: /api/notification/{**catch-all}
    // Chuyển tiếp tới: http://localhost:5295/hubs/notification
    // Note: Do transform của Gateway tự thêm /api/ nên có thể gây 404 nếu downstream không map /api/hubs/notification.
    // Trong trường hợp đó, người dùng nên chạy VITE_USE_GATEWAY=false để kết nối trực tiếp.
    const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5088"
    return `${gatewayUrl}/api/notification/hubs/notification`
  }
  const serviceUrl = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://localhost:5295"
  return `${serviceUrl}/hubs/notification`
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connection: null,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const response = await notificationApi.get("/notifications")
      // Backend bọc response trong ApiResponse: { success: true, data: [...] }
      const data = response.data?.data || response.data || []
      const notifications = Array.isArray(data) ? data : []
      const unreadCount = notifications.filter((n: Notification) => !n.isRead).length
      
      set({ notifications, unreadCount })
    } catch (error) {
      console.error("Lỗi fetch notifications:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notificationApi.put(`/notifications/${id}/read`)
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
      const unreadCount = notifications.filter((n) => !n.isRead).length
      set({ notifications, unreadCount })
    } catch (error) {
      console.error(`Lỗi mark notification ${id} as read:`, error)
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.put("/notifications/read-all")
      const notifications = get().notifications.map((n) => ({ ...n, isRead: true }))
      set({ notifications, unreadCount: 0 })
    } catch (error) {
      console.error("Lỗi mark all notifications as read:", error)
    }
  },

  startSignalR: (token: string) => {
    if (get().connection) return

    const hubUrl = getHubUrl()
    console.log(`Đang kết nối SignalR Hub tại: ${hubUrl}`)

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build()

    connection.on("ReceiveNotification", (notification: Notification) => {
      console.log("Nhận thông báo realtime:", notification)
      // Thêm thông báo mới lên đầu danh sách
      const notifications = [notification, ...get().notifications]
      const unreadCount = notifications.filter((n) => !n.isRead).length
      set({ notifications, unreadCount })

      // Hiển thị Browser Notification nếu được cấp quyền
      if (Notification.permission === "granted") {
        new window.Notification(notification.title, {
          body: notification.message,
        })
      }
    })

    connection
      .start()
      .then(() => {
        console.log("Kết nối SignalR Notification thành công!")
        set({ connection })
      })
      .catch((err) => {
        console.error("Lỗi kết nối SignalR Notification:", err)
      })
  },

  stopSignalR: () => {
    const connection = get().connection
    if (connection) {
      connection.stop().then(() => {
        console.log("Đã đóng kết nối SignalR Notification")
        set({ connection: null })
      })
    }
  },
}))
