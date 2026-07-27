import { useEffect, useState } from "react"
import { getJobById } from "@/features/jobs/api"
import { getServiceById } from "@/features/marketplace/api"

// Cache theo module, tách 2 nguồn vì id của Job và Service không cùng không gian.
const jobTitleCache = new Map<number, string | null>()
const serviceTitleCache = new Map<number, string | null>()

/** Nhãn dùng khi không tra được nguồn gốc — vẫn không lộ id ra UI. */
export const PROJECT_FALLBACK_NAME = "Dự án chưa đặt tên"

/**
 * Tra tên hiển thị của một dự án từ nguồn gốc của nó (tin tuyển dụng hoặc gói dịch vụ).
 *
 * Tách riêng khỏi `<ProjectName />` để nơi khác (breadcrumb, document.title) dùng được
 * giá trị chuỗi chứ không chỉ render ra được.
 */
export const useProjectName = (jobId?: number | null, serviceId?: number | null) => {
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

  return { title, isLoading }
}
