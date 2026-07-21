import React, { useEffect, useState } from "react"
import { getJobById } from "@/features/jobs/api"
import { getServiceById } from "@/features/marketplace/api"

interface ProjectNameProps {
  /** Dự án sinh từ luồng Job/Proposal. Đúng 1 trong 2 field có giá trị. */
  jobId?: number | null
  /** Dự án sinh từ việc mua thẳng gói trên Marketplace. */
  serviceId?: number | null
  className?: string
}

// Cache theo module, tách 2 nguồn vì id của Job và Service không cùng không gian.
const jobTitleCache = new Map<number, string | null>()
const serviceTitleCache = new Map<number, string | null>()

/**
 * Tên hiển thị của một dự án.
 *
 * Project KHÔNG có trường tên riêng — nó chỉ có id, contractId và một trong hai nguồn gốc
 * (jobId hoặc serviceId). Vì vậy trước đây mọi nơi đều phải hiện "Dự án #12", tức là phơi
 * khoá chính ra cho người dùng đọc. Component này lấy tên từ chính nguồn gốc đó:
 * tiêu đề tin tuyển dụng, hoặc tên gói dịch vụ đã mua.
 *
 * Không có nguồn nào để tra (dữ liệu lỗi) thì hiện "Dự án chưa đặt tên" — vẫn không lộ id.
 */
export const ProjectName: React.FC<ProjectNameProps> = ({ jobId, serviceId, className }) => {
  const cached =
    jobId != null ? jobTitleCache.get(jobId) : serviceId != null ? serviceTitleCache.get(serviceId) : undefined

  const [title, setTitle] = useState<string | null>(cached ?? null)
  const [isLoading, setIsLoading] = useState(cached === undefined && (jobId != null || serviceId != null))

  useEffect(() => {
    let cancelled = false

    const resolve = async () => {
      if (jobId != null) {
        if (jobTitleCache.has(jobId)) {
          setTitle(jobTitleCache.get(jobId) ?? null)
          setIsLoading(false)
          return
        }
        setIsLoading(true)
        try {
          const job = await getJobById(jobId)
          const t = job?.title?.trim() || null
          jobTitleCache.set(jobId, t)
          if (!cancelled) setTitle(t)
        } catch (e) {
          console.error(`Lỗi tải tên job ${jobId} cho dự án:`, e)
          jobTitleCache.set(jobId, null)
        } finally {
          if (!cancelled) setIsLoading(false)
        }
        return
      }

      if (serviceId != null) {
        if (serviceTitleCache.has(serviceId)) {
          setTitle(serviceTitleCache.get(serviceId) ?? null)
          setIsLoading(false)
          return
        }
        setIsLoading(true)
        try {
          const service = await getServiceById(serviceId)
          const t = service?.title?.trim() || null
          serviceTitleCache.set(serviceId, t)
          if (!cancelled) setTitle(t)
        } catch (e) {
          console.error(`Lỗi tải tên gói dịch vụ ${serviceId} cho dự án:`, e)
          serviceTitleCache.set(serviceId, null)
        } finally {
          if (!cancelled) setIsLoading(false)
        }
        return
      }

      setIsLoading(false)
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [jobId, serviceId])

  return <span className={className}>{isLoading ? "Đang tải..." : title ?? "Dự án chưa đặt tên"}</span>
}
