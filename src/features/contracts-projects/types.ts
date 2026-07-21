export const ProjectStatus = {
  Created: 0,
  InProgress: 1,
  Delivered: 2,
  Approved: 3,
  Closed: 4,
  /** Kết thúc sớm: Client dừng ngang hoặc tranh chấp đã phân xử. Cùng Closed là 2 trạng thái
   *  TERMINAL — chỉ khi đó Expert mới rút được tiền. */
  Cancelled: 5,
} as const

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus]

export interface Project {
  id: number
  contractId: number
  status: ProjectStatus
  statusName: string
  createdAt: string
  updatedAt: string
  // Đúng 1 trong 2 field có giá trị: jobId (luồng Job/Proposal) hoặc serviceId (mua thẳng Marketplace).
  jobId: number | null
  serviceId: number | null
  proposedPrice: number
  clientId: number
  expertId: number
  escrowTotalBalance: number
  escrowAvailableBalance: number
  escrowLockedBalance: number
}

export interface Contract {
  id: number
  proposalId: number | null
  serviceId: number | null
  clientId: number
  expertId: number
  proposedPrice: number | null
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

/** Một lần Expert nộp bài cho milestone. Mỗi lần yêu cầu sửa rồi nộp lại tạo thêm 1 bản ghi. */
export interface Deliverable {
  id: number
  milestoneId: number
  expertId: number
  fileUrl: string
  note: string
  submittedAt: string
}
