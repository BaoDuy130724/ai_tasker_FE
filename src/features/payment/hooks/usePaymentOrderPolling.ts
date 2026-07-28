import { useCallback, useEffect, useRef, useState } from "react"
import { getPaymentOrder } from "../api"
import type { PaymentOrder, PaymentOrderStatus } from "../types"

/** ~2 phút (30 × 4s) rồi DỪNG HẲN. Không poll vô hạn — xem ghi chú `exhausted` bên dưới. */
const POLL_INTERVAL_MS = 4_000
const MAX_POLL_ATTEMPTS = 30

/** Sống sót qua F5: người dùng thanh toán ở tab khác rồi quay lại reload là chuyện thường. */
const STORAGE_KEY = "aitasker.payment.pendingOrder"

export interface PendingOrder {
  orderCode: number
  amount: number
  description: string
  checkoutUrl: string | null
}

export interface PollState {
  /** Đơn đang theo dõi, `null` khi không có đơn nào chờ. */
  order: PendingOrder | null
  /** Đang trong một lượt hỏi BE. */
  isChecking: boolean
  /**
   * Đã hỏi hết số lần cho phép mà đơn vẫn `Pending`.
   *
   * ⚠️ KHÔNG được hiểu là "đã huỷ". Từ 2026-07-28 thanh toán thất bại GIỮ NGUYÊN
   * `Pending` (webhook không còn MarkCancelled vô điều kiện), nên `Pending` kéo dài chỉ
   * có nghĩa "chưa thấy tiền về" — người dùng có thể vẫn đang nhập OTP ở tab kia.
   */
  exhausted: boolean
  /** Trạng thái chốt cuối cùng đọc được, dùng để hiện thông báo. */
  lastStatus: PaymentOrderStatus | null
}

const readStored = (): PendingOrder | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingOrder
    return typeof parsed?.orderCode === "number" ? parsed : null
  } catch {
    return null
  }
}

/**
 * Theo dõi một đơn nạp PayOS cho tới khi nó ngã ngũ.
 *
 * Webhook của PayOS KHÔNG gọi được vào localhost, nên dưới môi trường dev thì chính
 * `GET /payment/payos/orders/{orderCode}` là thứ chốt tiền: handler bên BE tự hỏi PayOS
 * và cộng tiền khi thấy đã thanh toán. Vì vậy đây không phải "poll cho đẹp" — không hỏi
 * thì tiền không bao giờ vào ví khi chạy local.
 */
export const usePaymentOrderPolling = (
  onSettled: (status: PaymentOrderStatus, order: PaymentOrder) => void
) => {
  const [state, setState] = useState<PollState>(() => ({
    order: readStored(),
    isChecking: false,
    exhausted: false,
    lastStatus: null,
  }))

  // Mỗi lần bắt đầu theo dõi lại tăng token; vòng lặp cũ thấy token đổi thì tự thoát,
  // nhờ vậy hai đơn liên tiếp không chạy chồng lên nhau. Unmount cũng tăng token.
  const pollToken = useRef(0)
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled

  const clearOrder = useCallback(() => {
    pollToken.current += 1
    localStorage.removeItem(STORAGE_KEY)
    setState({ order: null, isChecking: false, exhausted: false, lastStatus: null })
  }, [])

  /** Hỏi BE đúng MỘT lần. Trả về true nếu đơn đã ngã ngũ (không cần hỏi nữa). */
  const checkOnce = useCallback(
    async (orderCode: number): Promise<boolean> => {
      setState((prev) => ({ ...prev, isChecking: true }))
      try {
        const order = await getPaymentOrder(orderCode)
        if (!order) return false

        setState((prev) => ({ ...prev, lastStatus: order.status }))
        if (order.status === "Pending") return false

        // Paid / Cancelled / Expired đều là trạng thái cuối — thôi theo dõi.
        pollToken.current += 1
        localStorage.removeItem(STORAGE_KEY)
        setState({ order: null, isChecking: false, exhausted: false, lastStatus: order.status })
        onSettledRef.current(order.status, order)
        return true
      } catch (err) {
        // 404 = không phải chủ đơn (hoặc đơn không tồn tại). Lỗi mạng cũng rơi vào đây.
        // Cả hai đều không phải lý do để kết luận đơn đã huỷ — cứ thử lại lượt sau.
        console.error("Không tra được đơn nạp PayOS:", err)
        return false
      } finally {
        setState((prev) => ({ ...prev, isChecking: false }))
      }
    },
    []
  )

  const startTracking = useCallback(
    async (order: PendingOrder) => {
      pollToken.current += 1
      const token = pollToken.current
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
      setState({ order, isChecking: false, exhausted: false, lastStatus: "Pending" })

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        if (pollToken.current !== token) return
        const settled = await checkOnce(order.orderCode)
        if (settled || pollToken.current !== token) return
      }

      // Hết lượt mà vẫn Pending: dừng lại và giao quyền quyết định cho người dùng
      // (nút "Kiểm tra lại"), thay vì hỏi mãi hoặc tự kết luận là đã huỷ.
      setState((prev) => (prev.order ? { ...prev, exhausted: true } : prev))
    },
    [checkOnce]
  )

  /** Người dùng bấm "Kiểm tra lại" sau khi vòng tự động đã hết lượt. */
  const recheck = useCallback(async () => {
    if (!state.order) return
    await checkOnce(state.order.orderCode)
  }, [checkOnce, state.order])

  /**
   * Đơn khôi phục từ localStorage sau F5: theo dõi tiếp, không bắt người dùng bấm gì.
   *
   * Việc bắt đầu và việc dừng phải nằm CHUNG một effect. Tách ra (dừng ở effect unmount,
   * bắt đầu ở effect có cờ "chỉ chạy một lần") thì dưới StrictMode của môi trường dev —
   * mount → unmount → mount — lượt unmount giết vòng lặp còn lượt mount thứ hai bị cờ
   * chặn, kết quả là đơn hiện trên màn mà không ai poll nó.
   */
  useEffect(() => {
    const stored = readStored()
    if (stored) void startTracking(stored)
    return () => {
      pollToken.current += 1
    }
  }, [startTracking])

  return { ...state, startTracking, recheck, clearOrder }
}
