/**
 * Kiểu dữ liệu của Payment service (ví nội bộ + PayOS).
 *
 * ⚠️ Payment KHÔNG dùng chung `ApiResponse` với 12 service kia — xem PaymentApiResponse
 * ngay dưới. Đừng import ApiResponse từ features/jobs/api vào đây.
 */

/**
 * `statusCode` của Payment là CHUỖI ("SUCCESS", "NOT_FOUND"...), không phải mã HTTP số
 * như chuẩn chung (`API_RESPONSE_STANDARD.md`). Ngoài ra envelope này KHÔNG có `errors`
 * và có thêm `timestamp`.
 *
 * BE biết đây là lệch chuẩn nhưng cố ý chưa sửa (đổi envelope = breaking change với FE),
 * xem PROJECT_CONTEXT mục 16.4. Vì vậy FE khai type riêng thay vì bẻ ApiResponse chung.
 */
export type PaymentStatusCode =
  | "SUCCESS"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_SERVER_ERROR"

export interface PaymentApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  statusCode: PaymentStatusCode
  timestamp: string
}

/** GET /payment/wallet/me — ví tự tạo ở lần gọi đầu, không cần tạo trước. */
export interface UserWallet {
  id: number
  userId: number
  /** Tiền tiêu được ngay (nạp escrow, tạo yêu cầu rút). */
  availableBalance: number
  /** Tiền đang bị giữ vì có yêu cầu rút chờ Admin duyệt. */
  lockedBalance: number
  createdAt: string
  updatedAt: string
}

/**
 * Payment BẬT JsonStringEnumConverter nên type/status là CHUỖI — khác hẳn escrow của
 * Project (enum số, xem EscrowTransaction trong features/contracts-projects/api.ts).
 */
export type WalletTransactionType =
  | "Deposit"
  | "Withdrawal"
  | "EscrowHold"
  | "EscrowRelease"
  | "EscrowRefund"

export type WalletTransactionStatus = "Pending" | "Completed" | "Failed" | "Cancelled"

export interface WalletTransaction {
  id: number
  userWalletId: number
  type: WalletTransactionType
  amount: number
  transactionCode: string
  status: WalletTransactionStatus
  idempotencyKey: string | null
  description: string | null
  createdAt: string
}

/**
 * `Expired` là trạng thái MỚI (2026-07-28) — trước đó không đường nào set được nên
 * chưa từng xuất hiện. Đừng viết `status !== "Paid"` rồi kết luận "đã huỷ": thanh toán
 * thất bại nay GIỮ NGUYÊN `Pending` (webhook không còn MarkCancelled vô điều kiện).
 */
export type PaymentOrderStatus = "Pending" | "Paid" | "Cancelled" | "Expired"

export interface PaymentOrder {
  id: number
  /**
   * Số 16 chữ số (~1.78e15 = mili-giây Unix × 1000 + bộ đếm). Vẫn dưới
   * Number.MAX_SAFE_INTEGER (9.007e15) nên `number` của JS an toàn — nhưng TUYỆT ĐỐI
   * không cắt chuỗi hay ép về int32, cả hai đều phá mã đơn.
   */
  orderCode: number
  userId: number
  amount: number
  description: string
  status: PaymentOrderStatus
  checkoutUrl: string | null
  createdAt: string
  paidAt: string | null
}

export type WithdrawalStatus = "Pending" | "Approved" | "Rejected"

export interface WithdrawalRequest {
  id: number
  userId: number
  amount: number
  bankName: string
  bankAccountNo: string
  bankAccountName: string
  status: WithdrawalStatus
  /** Chỉ có khi Admin từ chối. */
  reason: string | null
  createdAt: string
  processedAt: string | null
}

// --- Ràng buộc BE validate (sai là 422) — chặn sẵn ở form để khỏi tốn một vòng request ---

/** PayOS không nhận đơn dưới 2.000đ. */
export const MIN_DEPOSIT_AMOUNT = 2_000
/** Trần chung cho cả nạp lẫn rút. */
export const MAX_AMOUNT = 500_000_000
/** Giới hạn của PayOS, không phải của BE ta — vượt là PayOS từ chối tạo link. */
export const MAX_DESCRIPTION_LENGTH = 25
