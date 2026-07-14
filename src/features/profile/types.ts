// Profile service dùng ID kiểu int sau migration Guid→int (2026-07-14):
// UserProfile/Skill/PortfolioItem/Certificate đều dùng int; route BE là {id:int}, {skillId:int}.

export interface Skill {
  id: number
  name: string
  category: string
}

export interface PortfolioItem {
  id: number
  title: string
  description: string
  link: string
  imageUrl: string
}

export interface Certificate {
  id: number
  name: string
  fileUrl: string
  issuedBy: string
  issueDate: string
  status: string
}

export interface UserProfile {
  id: number
  userId: number
  fullName: string
  title: string
  bio: string
  avatarUrl: string
  role: string
  portfolioItems: PortfolioItem[]
  skills: Skill[]
  certificates: Certificate[]
}
