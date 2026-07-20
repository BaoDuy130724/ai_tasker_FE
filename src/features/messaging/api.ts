import { messagingApi } from "@/shared/api/client"
import type { ChatSession, ChatMessage } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

// Messaging dùng ID int (clientId/expertId/senderId/sessionId = userId của Identity/Job).
// Từ 2026-07-17 (BE chuẩn hóa API Response — docs/API_RESPONSE_STANDARD.md):
// ChatController bọc MỌI response trong ApiResponse<T>; MarkAsRead đổi 204 NoContent → 200 + envelope.

export interface CreateSessionInput {
  clientId: number
  expertId: number
  jobId?: number | null
}

export const getOrCreateSession = async (input: CreateSessionInput) => {
  const response = await messagingApi.post<ApiResponse<ChatSession>>("/Chat/sessions", input)
  return response.data?.data
}

export const getUserSessions = async (userId: number) => {
  const response = await messagingApi.get<ApiResponse<ChatSession[]>>(`/Chat/sessions/user/${userId}`)
  return response.data?.data || []
}

export const getChatHistory = async (sessionId: number) => {
  const response = await messagingApi.get<ApiResponse<ChatMessage[]>>(`/Chat/sessions/${sessionId}/messages`)
  return response.data?.data || []
}

export const markSessionAsRead = async (sessionId: number, userId: number) => {
  const response = await messagingApi.put<ApiResponse<null>>(`/Chat/sessions/${sessionId}/read/${userId}`)
  return response.data
}

// BE ChatController.SendMessageWithAttachment nhận [FromForm] senderId/content + IFormFile file (≤10MB).
// Lưu ý: đường REST này KHÔNG broadcast qua SignalR (chỉ đường hub "SendMessage" mới Clients.Group.SendAsync) —
// nên phía gửi phải tự thêm message vào state, phía nhận chỉ thấy khi load lại lịch sử.
export const sendMessageAttachment = async (sessionId: number, senderId: number, file: File, content?: string) => {
  const formData = new FormData()
  formData.append("senderId", String(senderId))
  if (content) formData.append("content", content)
  formData.append("file", file)
  const response = await messagingApi.post<ApiResponse<ChatMessage>>(
    `/Chat/sessions/${sessionId}/messages/attachment`,
    formData,
    { headers: { "Content-Type": undefined } }
  )
  return response.data?.data
}
