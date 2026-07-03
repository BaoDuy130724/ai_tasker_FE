export interface Skill {
  id: string
  name: string
  category: string
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  link: string
  imageUrl: string
}

export interface Certificate {
  id: string
  name: string
  fileUrl: string
  issuedBy: string
  issueDate: string
  status: string
}

export interface UserProfile {
  id: string
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
