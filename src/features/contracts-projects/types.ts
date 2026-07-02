export const ProjectStatus = {
  Created: 0,
  InProgress: 1,
  Delivered: 2,
  Approved: 3,
  Closed: 4,
} as const

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus]

export interface Project {
  id: number
  contractId: number
  status: ProjectStatus
  statusName: string
  createdAt: string
  updatedAt: string
  jobId: number
  proposedPrice: number
  clientId: number
  expertId: number
  escrowTotalBalance: number
  escrowAvailableBalance: number
  escrowLockedBalance: number
}

export interface Contract {
  id: number
  proposalId: number
  clientId: number
  expertId: number
  terms: string
  signedAt: string
}

export interface Milestone {
  id: number
  projectId: number
  title: string
  description: string
  dueDate: string
  amount: number
  status: number
  statusName: string
}
