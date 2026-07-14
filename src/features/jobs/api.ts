import { jobApi } from "@/shared/api/client"
import type { Job, JobStatus } from "./types"

export interface ApiResponse<T> {
  success: boolean
  message: string
  statusCode: number
  data: T
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface GetJobsParams {
  skill?: string
  minBudget?: number
  maxBudget?: number
  status?: JobStatus
  sortBy?: string
  descending?: boolean
  page?: number
  pageSize?: number
}

export const getJobs = async (params: GetJobsParams) => {
  const response = await jobApi.get<ApiResponse<PagedResult<Job>>>("/jobs", { params })
  return response.data?.data
}

export const getJobById = async (id: number) => {
  const response = await jobApi.get<ApiResponse<Job>>(`/jobs/${id}`)
  return response.data?.data
}

export interface CreateJobInput {
  title: string
  description: string
  budget: number
  deadline: string
  skills: string[]
  clientId: number
}

export const createJob = async (input: CreateJobInput) => {
  const response = await jobApi.post<ApiResponse<Job>>("/jobs", input)
  return response.data?.data
}

export interface UpdateJobInput {
  title: string
  description: string
  budget: number
  deadline: string
  skills: string[]
  clientId: number
}

export const updateJob = async (id: number, input: UpdateJobInput) => {
  const response = await jobApi.put<ApiResponse<Job>>(`/jobs/${id}`, input)
  return response.data?.data
}

export const closeJob = async (id: number, clientId: number) => {
  const response = await jobApi.put<ApiResponse<any>>(`/jobs/${id}/close`, { clientId })
  return response.data?.data
}
