// Messaging service dùng ID kiểu int sau migration Guid→int (2026-07-14):
// ChatSessionDto/MessageDto/senderId/sessionId đều là int; message có isRead + attachments[].

export interface ChatMessageAttachment {
  id: number
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export interface ChatMessage {
  id: number
  sessionId: number
  senderId: number
  content: string
  isRead: boolean
  createdAt: string
  attachments: ChatMessageAttachment[]
}

export interface ChatSession {
  id: number
  clientId: number
  expertId: number
  jobId: number | null
  createdAt: string
  updatedAt: string
  lastMessage: ChatMessage | null
}
