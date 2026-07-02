export const ProposalStatus = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
} as const

export type ProposalStatus = typeof ProposalStatus[keyof typeof ProposalStatus]

export interface Proposal {
  id: number
  jobId: number
  expertId: number
  proposedPrice: number
  estimatedDays: number
  description: string
  status: ProposalStatus
  createdAt: string
}
