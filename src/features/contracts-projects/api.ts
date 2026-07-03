import { projectApi } from "@/shared/api/client"
import type { Project, Contract, Milestone } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

export interface ApproveProposalResult {
  contract: Contract
  project: Project
}

export interface ProjectDetailResponse {
  project: Project
  milestones: Milestone[]
}

export interface EscrowTransaction {
  id: number
  escrowAccountId: number
  type: number
  typeName: string
  amount: number
  status: number
  statusName: string
  idempotencyKey: string
  createdAt: string
}

export interface Dispute {
  id: number
  projectId: number
  openedBy: number
  openerRole: string
  description: string
  evidenceFileUrl: string | null
  status: number
  statusName: string
  resolution: number | null
  resolvedBy: number | null
  resolvedAt: string | null
}

export const approveProposal = async (proposalId: number) => {
  const response = await projectApi.post<ApiResponse<ApproveProposalResult>>("/contracts/approve-proposal", {
    proposalId,
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
