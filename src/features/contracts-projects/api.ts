import { projectApi } from "@/shared/api/client"
import type { Project, Contract, Milestone, Deliverable } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

export interface ApproveProposalResult {
  contract: Contract
  project: Project
}

export interface ProjectDetailResponse {
  project: Project
  milestones: Milestone[]
}

// BE EscrowTransactionDto trả type/status là enum số (Project API không cấu hình
// JsonStringEnumConverter) + note; KHÔNG có typeName/statusName/idempotencyKey.
// type: 0 Deposit, 1 Lock, 2 Release, 3 Withdrawal, 4 Refund
// status: 0 Pending, 1 Completed, 2 Failed
export interface EscrowTransaction {
  id: number
  escrowAccountId: number
  type: number
  amount: number
  status: number
  note: string | null
  createdAt: string
}

// Khớp BE DisputeDto (KHÔNG có statusName — FE tự map từ status số).
// status: 0 Open, 1 UnderReview, 2 Resolved · resolution: 0 RefundClient, 1 ReleaseToExpert
export interface Dispute {
  id: number
  projectId: number
  openedBy: number
  openerRole: string
  description: string
  evidenceFileUrl: string | null
  status: number
  resolution: number | null
  resolvedBy: number | null
  resolvedAt: string | null
  createdAt: string
}

export const approveProposal = async (proposalId: number) => {
  const response = await projectApi.post<ApiResponse<ApproveProposalResult>>("/contracts/approve-proposal", {
    proposalId,
  })
  return response.data?.data
}

// Mua thẳng 1 AiService trên Marketplace — không qua Job/Proposal (quyết định kiến trúc leader
// team 2026-07-20: giao dịch Marketplace không có service/entity Order riêng, tái dùng
// Contract → Project → Milestone → Escrow sẵn có). ClientId lấy từ token, không truyền trong body.
// Trả về cùng shape với approveProposal (Contract + Project) — BE: POST /contracts/purchase-service.
export const purchaseService = async (serviceId: number) => {
  const response = await projectApi.post<ApiResponse<ApproveProposalResult>>("/contracts/purchase-service", {
    serviceId,
  })
  return response.data?.data
}

export const getProjects = async () => {
  const response = await projectApi.get<ApiResponse<Project[]>>("/projects")
  return response.data?.data || []
}

export const getProjectById = async (id: number) => {
  const response = await projectApi.get<ApiResponse<ProjectDetailResponse>>(`/projects/${id}`)
  return response.data?.data
}

// Milestone APIs
export interface CreateMilestoneInput {
  projectId: number
  title: string
  description: string
  dueDate: string
  amount: number
  // BE CreateMilestoneCommand yêu cầu Order (thứ tự mốc trong project).
  order: number
}

export const createMilestone = async (input: CreateMilestoneInput) => {
  const response = await projectApi.post<ApiResponse<Milestone>>("/milestones", input)
  return response.data?.data
}

export const approveMilestone = async (milestoneId: number) => {
  const response = await projectApi.patch<ApiResponse<any>>(`/milestones/${milestoneId}/approve`)
  return response.data?.data
}

export const requestRevision = async (milestoneId: number, reason: string) => {
  const response = await projectApi.patch<ApiResponse<any>>(`/milestones/${milestoneId}/request-revision`, {
    reason,
  })
  return response.data?.data
}

// Deliverable APIs
export interface SubmitDeliverableInput {
  milestoneId: number
  fileUrl: string
  note: string
}

export const submitDeliverable = async (input: SubmitDeliverableInput) => {
  const response = await projectApi.post<ApiResponse<any>>("/deliverables", input)
  return response.data?.data
}

// Lịch sử nộp bài của 1 milestone — mới nhất trước. Client xem trước khi duyệt,
// Expert xem lại mình đã nộp gì. BE chỉ cho Client/Expert của hợp đồng hoặc Admin đọc.
export const getDeliverablesByMilestone = async (milestoneId: number) => {
  const response = await projectApi.get<ApiResponse<Deliverable[]>>(
    `/deliverables/milestone/${milestoneId}`
  )
  return response.data?.data ?? []
}

// Escrow APIs
export interface DepositEscrowInput {
  projectId: number
  amount: number
  idempotencyKey: string
}

export const depositEscrow = async (input: DepositEscrowInput) => {
  const response = await projectApi.post<ApiResponse<any>>("/escrow/deposit", input)
  return response.data?.data
}

export interface WithdrawEscrowInput {
  projectId: number
  amount: number
  idempotencyKey: string
}

export const withdrawEscrow = async (input: WithdrawEscrowInput) => {
  const response = await projectApi.post<ApiResponse<any>>("/escrow/withdraw", input)
  return response.data?.data
}

export interface GetTransactionsParams {
  projectId: number
  page?: number
  pageSize?: number
}

export const getTransactionHistory = async (params: GetTransactionsParams) => {
  const response = await projectApi.get<ApiResponse<{ items: EscrowTransaction[]; totalCount: number }>>(
    "/escrow/transactions",
    { params }
  )
  return response.data?.data?.items || []
}

// Dispute APIs
export interface OpenDisputeInput {
  projectId: number
  description: string
  evidenceFileUrl?: string | null
}

/**
 * Client dừng dự án giữa chừng.
 * BE quyết cách chia tiền: đã có bàn giao thì toàn bộ phần chưa nghiệm thu chuyển cho Expert,
 * chưa bàn giao gì thì hoàn lại Client.
 */
export const cancelProject = async (projectId: number, reason?: string) => {
  await projectApi.post(`/projects/${projectId}/cancel`, { reason })
}

export const openDispute = async (input: OpenDisputeInput) => {
  const response = await projectApi.post<ApiResponse<Dispute>>("/disputes", input)
  return response.data?.data
}

export const resolveDispute = async (disputeId: number, resolution: number) => {
  const response = await projectApi.patch<ApiResponse<Dispute>>(`/disputes/${disputeId}/resolve`, {
    resolution,
  })
  return response.data?.data
}

export const getDisputes = async (projectId?: number) => {
  const response = await projectApi.get<ApiResponse<Dispute[]>>("/disputes", {
    params: projectId ? { projectId } : {},
  })
  return response.data?.data || []
}
