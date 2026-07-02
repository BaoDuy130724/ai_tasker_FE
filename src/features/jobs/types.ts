export const JobStatus = {
  Open: 0,
  Closed: 1,
} as const

export type JobStatus = typeof JobStatus[keyof typeof JobStatus]

export interface Job {
  id: number
  title: string
  description: string
  budget: number
  deadline: string
  skills: string[]
  status: JobStatus
  statusName: string
  clientId: number
  createdAt: string
  updatedAt: string | null
}
