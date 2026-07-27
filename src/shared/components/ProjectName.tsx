import React from "react"
import { useProjectName, PROJECT_FALLBACK_NAME } from "@/shared/hooks/useProjectName"

interface ProjectNameProps {
  /** Dự án sinh từ luồng Job/Proposal. Đúng 1 trong 2 field có giá trị. */
  jobId?: number | null
  /** Dự án sinh từ việc mua thẳng gói trên Marketplace. */
  serviceId?: number | null
  className?: string
}

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
  const { title, isLoading } = useProjectName(jobId, serviceId)

  return <span className={className}>{isLoading ? "Đang tải..." : title ?? PROJECT_FALLBACK_NAME}</span>
}
