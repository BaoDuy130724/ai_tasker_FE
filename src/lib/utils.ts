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
  if (status === 503) {
    return beMessage || "Dịch vụ thanh toán tạm thời không phản hồi. Vui lòng thử lại sau ít phút."
  }
  return beMessage || fallback
}

/** Mã HTTP của lỗi, hoặc `undefined` khi request còn không gửi đi được (mất mạng). */
export function getApiErrorStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

/**
 * Ví không đủ tiền để nạp escrow — lỗi NGƯỜI DÙNG TỰ SỬA ĐƯỢC (đi nạp ví rồi quay lại).
 *
 * Từ 2026-07-28 `POST /escrow/deposit` trừ tiền thật trong ví qua Payment service, nên nó
 * sinh ra hai ca 422 mang cùng ý nghĩa "hãy nạp ví" (PROJECT_CONTEXT 17.4):
 *   - ví có nhưng thiếu tiền → "Insufficient available balance."
 *   - chưa từng nạp nên chưa có ví → "User must top up first."
 *
 * Phải soi message chứ không thể chỉ nhìn 422: 422 cũng là mã của các lỗi nghiệp vụ khác
 * ở cùng endpoint (nạp sai giá hợp đồng, nạp lần thứ hai) mà nạp ví không cứu được.
 */
export function isInsufficientBalanceError(err: unknown): boolean {
  if (getApiErrorStatus(err) !== 422) return false
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes("insufficient") || normalized.includes("top up")
}

/**
 * Payment service chết / sai URL / sai API key — người dùng KHÔNG sửa được.
 *
 * Project cố ý tách 503 khỏi 422 thay vì gộp cả hai vào 500: gộp là bắt người dùng đi tìm
 * bug trong khi thứ họ cần đọc chỉ là "hãy nạp tiền".
 */
export function isServiceUnavailableError(err: unknown): boolean {
  return getApiErrorStatus(err) === 503
}
