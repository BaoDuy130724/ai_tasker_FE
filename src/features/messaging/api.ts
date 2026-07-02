import { messagingApi } from "@/shared/api/client"
import type { ChatSession, ChatMessage } from "./types"

export const intToGuid = (id: number): string => {
  const hex = id.toString(16).padStart(12, "0")
  return `00000000-0000-0000-0000-${hex}`
}

export const guidToInt = (guid: string): number => {
  const parts = guid.split("-")
  const hex = parts[parts.length - 1]
  return parseInt(hex, 16)
}

export interface CreateSessionInput {
  clientId: string
  expertId: string
  jobId?: string | null
}

export const getOrCreateSession = async (input: CreateSessionInput) => {
  const response = await messagingApi.post<ChatSession>("/Chat/sessions", input)
  return response.data
}

export const getUserSessions = async (userId: string) => {
  const response = await messagingApi.get<ChatSession[]>(`/Chat/sessions/user/${userId}`)
  return response.data || []
}

export const getChatHistory = async (sessionId: string) => {
  const response = await messagingApi.get<ChatMessage[]>(`/Chat/sessions/${sessionId}/messages`)
  return response.data || []
}
