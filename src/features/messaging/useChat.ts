import { useCallback, useEffect, useRef, useState } from "react"
import * as signalR from "@microsoft/signalr"
import { useAuthStore } from "@/features/auth/store"
import { useToast } from "@/shared/ui/use-toast"
import {
  getChatHistory,
  getOrCreateSession,
  getUserSessions,
  markSessionAsRead,
  sendMessageAttachment,
} from "./api"
import type { ChatMessage, ChatSession } from "./types"

/**
 * Toàn bộ logic chat realtime, tách khỏi ChatPage để trang chat và bubble chat
 * dùng CHUNG một nguồn — tránh việc sửa một bên rồi hai bên lệch hành vi.
 *
 * Đây là thao tác chuyển chỗ nguyên trạng: thứ tự effect, cách chống trùng tin nhắn,
 * cách join/leave SignalR group đều giữ y như bản trong ChatPage.
 *
 * @param targetExpertId Khi Client bấm "Chat" với một Expert cụ thể (query param của
 *   trang chat). Bubble không dùng tham số này nên truyền null.
 */
export const useChat = (targetExpertId?: string | null) => {
  const toast = useToast()
  const { user, accessToken } = useAuthStore()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null)
  const [isSendingAttachment, setIsSendingAttachment] = useState(false)

  const myId = user ? Number(user.id) : 0

  // 1. Fetch sessions & khởi tạo session mới nếu có targetExpertId
  const loadSessions = useCallback(async () => {
    if (!user) return
    try {
      const userId = Number(user.id)
      let activeList = await getUserSessions(userId)

      if (targetExpertId && user.role === "Client") {
        const expertId = Number(targetExpertId)
        let existing = activeList.find((s) => s.expertId === expertId && s.clientId === userId)

        if (!existing) {
          existing = await getOrCreateSession({ clientId: userId, expertId, jobId: null })
          activeList = await getUserSessions(userId)
        }

        if (existing) setActiveSession(existing)
      } else if (activeList.length > 0) {
        // Chỉ chọn mặc định khi chưa có session nào đang mở. Dùng functional update để
        // không phải đưa `activeSession` vào dependency (sẽ chạy lại mỗi lần đổi session).
        setActiveSession((prev) => prev ?? activeList[0])
      }

      setSessions(activeList)
    } catch (err) {
      console.error("Lỗi fetch sessions:", err)
    }
  }, [user, targetExpertId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // 2. Tải lịch sử chat khi chọn session + đánh dấu đã đọc
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeSession) return
      try {
        const history = await getChatHistory(activeSession.id)
        setMessages(history.reverse()) // API có thể trả về sắp xếp ngược
      } catch (err) {
        console.error("Lỗi tải lịch sử chat:", err)
      }
    }
    fetchHistory()

    if (activeSession && myId) {
      markSessionAsRead(activeSession.id, myId).catch((err) =>
        console.error("Lỗi đánh dấu đã đọc:", err)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession])

  // 3. Kết nối SignalR Chat Hub
  useEffect(() => {
    if (!accessToken || !activeSession) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5200/hubs/chat", {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect()
      .build()

    connection
      .start()
      .then(() => {
        console.log("Đã kết nối thành công tới Chat Hub!")
        connection.invoke("JoinSession", activeSession.id)
        setHubConnection(connection)
      })
      .catch((err) => {
        console.error("Lỗi kết nối Chat Hub:", err)
      })

    connection.on("ReceiveMessage", (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    })

    return () => {
      if (connection) {
        connection.invoke("LeaveSession", activeSession.id).catch(console.error)
        connection.stop()
      }
    }
  }, [activeSession, accessToken])

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputText.trim() || !activeSession || !hubConnection || !user) return

      try {
        await hubConnection.invoke("SendMessage", {
          sessionId: activeSession.id,
          senderId: myId,
          content: inputText.trim(),
        })
        setInputText("")
      } catch (err) {
        console.error("Lỗi gửi tin nhắn qua SignalR:", err)
        toast.error("Không gửi được tin nhắn.", "Vui lòng kiểm tra lại kết nối.")
      }
    },
    [inputText, activeSession, hubConnection, user, myId, toast]
  )

  const sendAttachment = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !activeSession || !myId) return
      setIsSendingAttachment(true)
      try {
        const message = await sendMessageAttachment(activeSession.id, myId, file)
        // Đường REST đính kèm không broadcast qua SignalR (chỉ hub "SendMessage" mới làm việc đó) —
        // tự thêm vào state để người gửi thấy ngay; phía kia chỉ thấy khi load lại lịch sử (gap BE).
        if (message) {
          setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
        }
      } catch (err) {
        console.error("Lỗi gửi file đính kèm:", err)
        toast.error("Gửi file đính kèm thất bại.", "Kiểm tra lại dung lượng file (tối đa 10MB).")
      } finally {
        setIsSendingAttachment(false)
        e.target.value = ""
      }
    },
    [activeSession, myId, toast]
  )

  const getPartnerId = useCallback(
    (session: ChatSession) => (user?.role === "Client" ? session.expertId : session.clientId),
    [user?.role]
  )

  /** Số hội thoại có tin nhắn cuối chưa đọc và KHÔNG phải do mình gửi. */
  const unreadCount = sessions.filter(
    (s) => s.lastMessage && !s.lastMessage.isRead && s.lastMessage.senderId !== myId
  ).length

  return {
    user,
    myId,
    sessions,
    activeSession,
    setActiveSession,
    messages,
    inputText,
    setInputText,
    isSendingAttachment,
    sendMessage,
    sendAttachment,
    getPartnerId,
    unreadCount,
    reloadSessions: loadSessions,
  }
}

/** Dùng chung cho cả trang chat và bubble. */
export const useMessagesEndRef = (deps: unknown) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }, [deps])
  return ref
}
