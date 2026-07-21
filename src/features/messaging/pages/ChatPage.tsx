import React, { useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useChat, useMessagesEndRef } from "../useChat"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, User, Clock, CheckCircle, Paperclip, FileText, Download } from "lucide-react"
import { UserLink } from "@/shared/components/UserLink"

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const targetExpertId = searchParams.get("expertId")

  // Logic dùng chung với ChatBubble — xem features/messaging/useChat.ts
  const {
    myId,
    sessions,
    activeSession,
    setActiveSession,
    messages,
    inputText,
    setInputText,
    isSendingAttachment,
    sendMessage: handleSendMessage,
    sendAttachment: handleAttachmentSelected,
    getPartnerId,
  } = useChat(targetExpertId)

  const messagesEndRef = useMessagesEndRef(messages)
  const fileInputRef = useRef<HTMLInputElement>(null)


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
                      <UserLink
                        userId={getPartnerId(s)}
                        className="pointer-events-none font-bold text-foreground"
                      />
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
                  <h3 className="font-bold text-sm text-foreground">
                    <UserLink
                      userId={getPartnerId(activeSession)}
                      className="font-bold text-foreground hover:underline"
                    />
                  </h3>
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
                const isMine = m.senderId === myId
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
                      {m.content && <p>{m.content}</p>}
                      {m.attachments?.length > 0 && (
                        <div className={`space-y-1.5 ${m.content ? "mt-2" : ""}`}>
                          {m.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                                isMine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-background hover:bg-secondary/60 border border-border"
                              }`}
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="flex-1 truncate font-medium">{att.fileName}</span>
                              <span className="opacity-70 shrink-0">{formatFileSize(att.fileSize)}</span>
                              <Download className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
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
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleAttachmentSelected}
                disabled={isSendingAttachment}
              />
              <Button
                type="button"
                variant="outline"
                className="border-border shrink-0"
                disabled={isSendingAttachment}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Đính kèm file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
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
