export interface AdminUser {
  id: number
  email: string
  fullName: string
  role: string
  isLocked: boolean
}

export interface Certificate {
  id: string
  name: string
  fileUrl: string
  issuedBy: string
  issueDate: string
  status: string // Pending | Approved | Rejected
}

export interface DashboardKpi {
  totalUsers: number
  totalJobs: number
  totalServices: number
}
