import React, { useRef } from "react"
import { ArrowLeft, Clock, Download, FileText, MessageSquare, Paperclip, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserLink } from "@/shared/components/UserLink"
import { useDraggable } from "@/shared/hooks/useDraggable"
import { useChat, useMessagesEndRef } from "../useChat"
import type { ChatSession } from "../types"

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

interface ChatBubbleProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

/**
 * Chat nổi kiểu Messenger: một nút tròn ở góc phải, bấm ra panel gọn.
 *
 * Khác trang /messages ở chỗ panel hẹp nên KHÔNG chia hai cột — danh sách hội thoại và
 * khung chat thay phiên nhau trong cùng một panel, có nút quay lại. Toàn bộ logic
 * (SignalR, lịch sử, gửi file) lấy từ useChat nên giống hệt trang chat.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ isOpen, onToggle, onClose }) => {
  const { position, handleMouseDown, wasDragged, isDragging } = useDraggable()
  const {
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
  } = useChat(null)

  const messagesEndRef = useMessagesEndRef(messages)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const renderSessionList = () => (
    <div className="flex-1 overflow-y-auto divide-y divide-border/60">
      {sessions.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">Chưa có cuộc hội thoại nào</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hội thoại sẽ xuất hiện khi bạn bắt đầu trao đổi với đối tác.
          </p>
        </div>
      ) : (
        sessions.map((s: ChatSession) => {
          const isUnread = Boolean(s.lastMessage && !s.lastMessage.isRead && s.lastMessage.senderId !== myId)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSession(s)}
              className="block w-full p-3 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-xs font-bold text-foreground">
                  <UserLink
                    userId={getPartnerId(s)}
                    showAvatar
                    className="pointer-events-none inline-flex items-center gap-1.5 font-bold text-foreground"
                  />
                </span>
                <span className="shrink-0 text-[9px] text-muted-foreground">
                  {s.lastMessage ? formatTime(s.lastMessage.createdAt) : ""}
                </span>
              </div>
              <p
                className={`mt-1 truncate text-xs ${
                  isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.lastMessage ? s.lastMessage.content || "(tệp đính kèm)" : "Bắt đầu cuộc trò chuyện..."}
              </p>
            </button>
          )
        })
      )}
    </div>
  )

  const renderConversation = () => (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m) => {
          const isMine = m.senderId === myId
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                  isMine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-foreground"
                }`}
              >
                {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}

                {m.attachments?.length > 0 && (
                  <div className={`space-y-1.5 ${m.content ? "mt-2" : ""}`}>
                    {m.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                          isMine
                            ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                            : "border border-border bg-background hover:bg-secondary/60"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 truncate font-medium">{att.fileName}</span>
                        <span className="shrink-0 opacity-70">{formatFileSize(att.fileSize)}</span>
                        <Download className="h-3 w-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                <span className="mt-1 flex items-center justify-end gap-0.5 text-[9px] opacity-60">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTime(m.createdAt)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-1.5 border-t border-border p-2.5">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={sendAttachment}
          disabled={isSendingAttachment}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={isSendingAttachment}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Đính kèm file"
        >
          <Paperclip />
        </Button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="min-w-0 flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" aria-label="Gửi tin nhắn">
          <Send />
        </Button>
      </form>
    </>
  )

  return (
    <>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (wasDragged()) return
          onToggle()
        }}
        aria-label={isOpen ? "Đóng tin nhắn" : "Mở tin nhắn"}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className={`fixed bottom-6 right-24 z-50 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-transform duration-75 hover:scale-105 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${
          isOpen
            ? "border-border bg-secondary text-foreground hover:bg-secondary/90"
            : "border-primary/20 bg-primary text-primary-foreground hover:bg-primary/95"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}

        {/* Badge chỉ có nghĩa khi đang đóng — mở ra rồi thì người dùng đang đọc. */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
          className="fixed bottom-20 left-6 right-6 z-50 flex h-[500px] max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200 animate-in slide-in-from-bottom-5 md:left-auto md:w-[380px]"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border p-3">
            <div className="flex min-w-0 items-center gap-2">
              {activeSession && (
                <button
                  type="button"
                  onClick={() => setActiveSession(null)}
                  aria-label="Quay lại danh sách hội thoại"
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <h2 className="truncate text-sm font-extrabold text-foreground">
                {activeSession ? (
                  <UserLink
                    userId={getPartnerId(activeSession)}
                    showAvatar
                    className="inline-flex items-center gap-1.5 font-extrabold text-foreground hover:underline"
                  />
                ) : (
                  "Tin nhắn"
                )}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activeSession ? renderConversation() : renderSessionList()}
        </div>
      )}
    </>
  )
}
