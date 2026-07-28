import { paymentApi } from "@/shared/api/client"
import type {
  PaymentApiResponse,
  PaymentOrder,
  UserWallet,
  WalletTransaction,
  WithdrawalRequest,
} from "./types"

/**
 * ⚠️ Mọi path ở đây phải mang ĐẦY ĐỦ tiền tố "/payment/..." — giống features/admin/api.ts
 * viết "/admin/users".
 *
 * baseURL của paymentApi chỉ là ".../api" (xem nhánh `admin || payment` trong
 * shared/api/client.ts) vì Gateway forward nguyên path `/api/payment/**` thay vì gỡ
 * tiền tố như 10 route kia. Bỏ chữ "payment" ở đây thì gateway mode ra /api/wallet/me
 * → 404. Đây là mẫu duy nhất đúng ở cả gateway mode lẫn direct mode.
 */

// --- Ví ---

/** Ví được tạo lazy ở BE ngay lần gọi đầu — không có endpoint "tạo ví" và cũng không cần. */
export const getMyWallet = async () => {
  const response = await paymentApi.get<PaymentApiResponse<UserWallet>>("/payment/wallet/me")
  return response.data?.data ?? null
}

export interface GetWalletTransactionsParams {
  page?: number
  pageSize?: number
}

/** Trả về MẢNG PHẲNG (không bọc { items, totalCount } như escrow của Project). */
export const getWalletTransactions = async (params: GetWalletTransactionsParams = {}) => {
  const response = await paymentApi.get<PaymentApiResponse<WalletTransaction[]>>(
    "/payment/wallet/transactions",
    { params: { page: params.page ?? 1, pageSize: params.pageSize ?? 10 } }
  )
  return response.data?.data ?? []
}

// --- Nạp tiền qua PayOS ---

export interface CreatePaymentLinkInput {
  /** >= 2.000 và <= 500.000.000 (MIN_DEPOSIT_AMOUNT / MAX_AMOUNT). */
  amount: number
  /** Không rỗng, TỐI ĐA 25 ký tự — giới hạn của PayOS. */
  description: string
  returnUrl?: string
  cancelUrl?: string
}

export const createPaymentLink = async (input: CreatePaymentLinkInput) => {
  const response = await paymentApi.post<PaymentApiResponse<PaymentOrder>>(
    "/payment/payos/create-payment-link",
    input
  )
  return response.data?.data ?? null
}

/**
 * Tra cứu đơn nạp. Handler phía BE tự hỏi PayOS và CỘNG TIỀN khi thấy đã thanh toán —
 * nên đây cũng là cách chốt tiền khi webhook PayOS không gọi được vào localhost.
 *
 * Chỉ CHỦ ĐƠN (hoặc Admin) đọc được; người khác nhận 404 chứ không phải 403 — 403 sẽ
 * xác nhận đơn có tồn tại, giúp dò quét ra mã đơn hợp lệ.
 */
export const getPaymentOrder = async (orderCode: number) => {
  const response = await paymentApi.get<PaymentApiResponse<PaymentOrder>>(
    `/payment/payos/orders/${orderCode}`
  )
  return response.data?.data ?? null
}

// --- Rút tiền về ngân hàng ---

export interface RequestWithdrawalInput {
  /** > 0 và <= 500.000.000. */
  amount: number
  bankName: string
  /** CHỈ CHỮ SỐ — BE validate, có khoảng trắng / dấu gạch là 422. */
  bankAccountNo: string
  bankAccountName: string
}

/**
 * Tạo yêu cầu rút. Ví chuyển tiền available → locked NGAY lập tức (không chờ Admin),
 * nên số dư khả dụng tụt xuống ngay sau khi gọi thành công.
 */
export const requestWithdrawal = async (input: RequestWithdrawalInput) => {
  const response = await paymentApi.post<PaymentApiResponse<WithdrawalRequest>>(
    "/payment/withdrawals",
    input
  )
  return response.data?.data ?? null
}

export const getMyWithdrawals = async () => {
  const response = await paymentApi.get<PaymentApiResponse<WithdrawalRequest[]>>(
    "/payment/withdrawals/me"
  )
  return response.data?.data ?? []
}

// --- Admin duyệt rút tiền ---

export const getPendingWithdrawals = async () => {
  const response = await paymentApi.get<PaymentApiResponse<WithdrawalRequest[]>>(
    "/payment/withdrawals/admin/pending"
  )
  return response.data?.data ?? []
}

/** Trừ hẳn phần locked. Admin tự chuyển khoản tay NGOÀI hệ thống — BE không làm việc đó. */
export const approveWithdrawal = async (id: number) => {
  const response = await paymentApi.post<PaymentApiResponse<WithdrawalRequest>>(
    `/payment/withdrawals/${id}/approve`
  )
  return response.data?.data ?? null
}

/** Trả tiền từ locked về available. */
export const rejectWithdrawal = async (id: number, reason: string) => {
  const response = await paymentApi.post<PaymentApiResponse<WithdrawalRequest>>(
    `/payment/withdrawals/${id}/reject`,
    { reason }
  )
  return response.data?.data ?? null
}
