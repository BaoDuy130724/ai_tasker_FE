export interface ChatSession {
  id: string
  clientId: string
  expertId: string
  jobId: string | null
  createdAt: string
  updatedAt: string
  lastMessage: ChatMessage | null
}

export interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  content: string
  createdAt: string
  fileUrl?: string | null
  fileName?: string | null
}
