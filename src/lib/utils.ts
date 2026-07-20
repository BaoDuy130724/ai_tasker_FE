import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rút message lỗi hiển thị từ AxiosError, phân biệt rõ 401/403.
 *
 * BE 2026-07-20 siết auth (ProjectAccessPolicy, Job JWT): các thao tác sai vai trò
 * nay trả 401/403 thật. Lưu ý `Forbid()` của ASP.NET trả 403 KHÔNG body — nếu chỉ đọc
 * `err.response.data.message` sẽ rơi về fallback chung chung ("...thất bại") làm người
 * dùng tưởng lỗi hệ thống trong khi thật ra là không có quyền.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { message?: string } } }
  const status = e?.response?.status
  const beMessage = e?.response?.data?.message

  if (status === 401) {
    return beMessage || "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại."
  }
  if (status === 403) {
    return beMessage || "Bạn không có quyền thực hiện thao tác này (không phải Client/Expert của hợp đồng, hoặc cần quyền Admin)."
  }
  return beMessage || fallback
}
