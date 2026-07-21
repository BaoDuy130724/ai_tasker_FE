import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getJobById } from "@/features/jobs/api"

interface JobLinkProps {
  jobId: number
  className?: string
}

// Cache theo module: một danh sách nhiều proposal có thể trỏ về cùng một job.
const jobTitleCache = new Map<number, string | null>()

/**
 * Thay cho việc render thẳng "Job ID #123" — resolve jobId sang tiêu đề thật
 * và link sang /jobs/{jobId}.
 *
 * Không bao giờ hiện id ra UI: id là chi tiết cài đặt, người dùng không đọc được gì từ nó.
 * Khi không tải được thì nói rõ là không tải được, chứ không lùi về hiện số.
 */
export const JobLink: React.FC<JobLinkProps> = ({ jobId, className }) => {
  const [title, setTitle] = useState<string | null>(jobTitleCache.get(jobId) ?? null)
  const [isLoading, setIsLoading] = useState(!jobTitleCache.has(jobId))

  useEffect(() => {
    if (jobTitleCache.has(jobId)) {
      setTitle(jobTitleCache.get(jobId) ?? null)
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    getJobById(jobId)
      .then((job) => {
        const t = job?.title?.trim() || null
        jobTitleCache.set(jobId, t)
        if (!cancelled) setTitle(t)
      })
      .catch((e) => {
        console.error(`Lỗi tải tiêu đề job ${jobId}:`, e)
        jobTitleCache.set(jobId, null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobId])

  return (
    <Link to={`/jobs/${jobId}`} className={className}>
      {isLoading ? "Đang tải..." : title ?? "Không tải được tên công việc"}
    </Link>
  )
}
