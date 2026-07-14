import { messagingApi } from "@/shared/api/client"
import type { ChatSession, ChatMessage } from "./types"

// Messaging service trả DTO thuần (KHÔNG bọc ApiResponse) và dùng ID int.
// clientId/expertId/senderId/sessionId đều là int (userId của Identity/Job).

export interface CreateSessionInput {
  clientId: number
  expertId: number
  jobId?: number | null
}

export const getOrCreateSession = async (input: CreateSessionInput) => {
  const response = await messagingApi.post<ChatSession>("/Chat/sessions", input)
  return response.data
}

export const getUserSessions = async (userId: number) => {
  const response = await messagingApi.get<ChatSession[]>(`/Chat/sessions/user/${userId}`)
  return response.data || []
}

export const getChatHistory = async (sessionId: number) => {
  const response = await messagingApi.get<ChatMessage[]>(`/Chat/sessions/${sessionId}/messages`)
  return response.data || []
}

export const markSessionAsRead = async (sessionId: number, userId: number) => {
  const response = await messagingApi.put(`/Chat/sessions/${sessionId}/read/${userId}`)
  return response.data
}
