import React, { useEffect, useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { getOrCreateSession, getUserSessions, getChatHistory, markSessionAsRead, intToGuid } from "../api"
import type { ChatSession, ChatMessage } from "../types"
import * as signalR from "@microsoft/signalr"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, User, Clock, CheckCircle } from "lucide-react"

export const ChatPage: React.FC = () => {
  const { user, accessToken } = useAuthStore()
  const [searchParams] = useSearchParams()
  const targetExpertId = searchParams.get("expertId")

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const myGuid = user ? intToGuid(Number(user.id)) : ""

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 1. Fetch sessions & Khởi tạo session mới nếu có targetExpertId
  const loadSessions = async () => {
    if (!user) return
    try {
      const userGuid = intToGuid(Number(user.id))
      let activeList = await getUserSessions(userGuid)
      
      // Nếu Client click "Chat" với Expert từ trang nào đó (truyền targetExpertId)
      if (targetExpertId && user.role === "Client") {
        const expertGuid = intToGuid(Number(targetExpertId))
        // Check xem đã có session chưa
        let existing = activeList.find(s => s.expertId === expertGuid && s.clientId === userGuid)
        
        if (!existing) {
          // Tạo session mới
          existing = await getOrCreateSession({
            clientId: userGuid,
            expertId: expertGuid,
            jobId: null,
          })
          // Reload lại list
          activeList = await getUserSessions(userGuid)
        }
        
        if (existing) {
          setActiveSession(existing)
        }
      } else if (activeList.length > 0 && !activeSession) {
        // Mặc định chọn session đầu tiên
        setActiveSession(activeList[0])
      }
      
      setSessions(activeList)
    } catch (err) {
      console.error("Lỗi fetch sessions:", err)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [user, targetExpertId])

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

    if (activeSession && myGuid) {
      markSessionAsRead(activeSession.id, myGuid).catch((err) =>
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
        // Join vào group chat của session hiện tại
        connection.invoke("JoinSession", activeSession.id)
        setHubConnection(connection)
      })
      .catch((err) => {
        console.error("Lỗi kết nối Chat Hub:", err)
      })

    // Lắng nghe tin nhắn mới từ Hub
    connection.on("ReceiveMessage", (message: ChatMessage) => {
      setMessages((prev) => {
        // Tránh trùng lặp tin nhắn
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeSession || !hubConnection || !user) return

    const messageDto = {
      sessionId: activeSession.id,
      senderId: myGuid,
      content: inputText.trim(),
    }

    try {
      // Gọi qua SignalR invoke SendMessage
      await hubConnection.invoke("SendMessage", messageDto)
      setInputText("")
    } catch (err) {
      console.error("Lỗi gửi tin nhắn qua SignalR:", err)
      alert("Không thể gửi tin nhắn. Vui lòng kiểm tra lại kết nối.")
    }
  }

  const getPartnerLabel = (session: ChatSession) => {
    const isClientRole = user?.role === "Client"
    const partnerId = isClientRole ? session.expertId : session.clientId
    // Cắt bớt phần Guid dài
    return `Đối tác #${partnerId.substring(partnerId.length - 6).toUpperCase()}`
  }

  return (
    <div className="max-w-5xl mx-auto h-[600px] bg-card border border-border rounded-xl shadow-sm overflow-hidden flex">
      {/* Sessions list (Left) */}
      <div className="w-1/3 border-r border-border flex flex-col bg-secondary/10">
        <div className="p-4 border-b border-border bg-card">
          <h2 className="font-extrabold text-base flex items-center gap-1.5">
            <MessageSquare className="h-5 w-5 text-primary" />
            Hộp thư Chat Realtime
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Chưa có cuộc hội thoại nào
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = activeSession?.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`w-full text-left p-4 hover:bg-secondary/40 transition-all block ${
                    isSelected ? "bg-primary/5 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-foreground block truncate">
                      {getPartnerLabel(s)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {s.lastMessage ? new Date(s.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {s.lastMessage ? s.lastMessage.content : "Bắt đầu cuộc trò chuyện..."}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat pane (Right) */}
      <div className="flex-1 flex flex-col bg-card">
        {activeSession ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{getPartnerLabel(activeSession)}</h3>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                    <CheckCircle className="h-3 w-3 fill-emerald-500 text-white" />
                    Đã kết nối Realtime
                  </span>
                </div>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m) => {
                const isMine = m.senderId.toLowerCase() === myGuid.toLowerCase()
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-secondary text-foreground rounded-tl-none"
                      }`}
                    >
                      <p>{m.content}</p>
                      <span className="block text-[9px] text-right mt-1.5 opacity-60 flex items-center justify-end gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" className="bg-primary text-primary-foreground font-semibold flex items-center gap-1">
                Gửi
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-bold text-foreground">Không có cuộc hội thoại nào đang chọn</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Chọn một đối tác ở danh sách bên trái hoặc click Chat từ tin tuyển dụng.</p>
          </div>
        )}
      </div>
    </div>
  )
}
