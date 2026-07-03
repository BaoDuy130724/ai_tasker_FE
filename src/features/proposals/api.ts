import { projectApi } from "@/shared/api/client"
import type { Proposal } from "./types"
import type { ApiResponse } from "@/features/jobs/api"

export interface SubmitProposalInput {
  jobId: number
  proposedPrice: number
  estimatedDays: number
  description: string
}

export const submitProposal = async (input: SubmitProposalInput) => {
  const response = await projectApi.post<ApiResponse<Proposal>>("/proposals", input)
  return response.data?.data
}

export const getProposalsByJob = async (jobId: number) => {
  const response = await projectApi.get<ApiResponse<Proposal[]>>(`/proposals/by-job/${jobId}`)
  return response.data?.data || []
}

export const getMyProposals = async () => {
  const response = await projectApi.get<ApiResponse<Proposal[]>>("/proposals/my-proposals")
  return response.data?.data || []
}
