export interface AdminUser {
  id: number
  email: string
  fullName: string
  role: string
  isLocked: boolean
}

export interface Certificate {
  id: number
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
  /**
   * Thời điểm snapshot được tạo. BE trả DateTime.MinValue ("0001-01-01...") khi
   * CHƯA từng đồng bộ lần nào — lúc đó mọi số đếm đều là 0 mặc định, không phải
   * số thật. Trước đây field này bị bỏ khỏi type nên FE hiển thị 0 như dữ liệu thật.
   */
  generatedAt: string
}

export interface AdminJob {
  id: number
  title: string
  status: string
  ownerUserId: number
}

export interface AdminService {
  id: number
  title: string
  price: number
  expertUserId: number
}
