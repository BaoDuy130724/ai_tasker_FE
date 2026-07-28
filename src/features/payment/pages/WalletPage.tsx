import React, { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { getApiErrorMessage } from "@/lib/utils"
import {
  createPaymentLink,
  getMyWallet,
  getWalletTransactions,
} from "../api"
import {
  MAX_AMOUNT,
  MAX_DESCRIPTION_LENGTH,
  MIN_DEPOSIT_AMOUNT,
  type UserWallet,
  type WalletTransaction,
} from "../types"
import { formatVnd } from "../currency"
import { WalletTransactionList } from "../components/WalletTransactionList"
import { usePaymentOrderPolling } from "../hooks/usePaymentOrderPolling"
import {
  AlertTriangle,
  ArrowDownLeft,
  ExternalLink,
  Loader2,
  Lock,
  PlusCircle,
  RefreshCw,
  Wallet,
} from "lucide-react"

/** Gợi ý mệnh giá — bấm nhanh hơn gõ, và đều nằm trong khoảng BE cho phép. */
const QUICK_AMOUNTS = [50_000, 200_000, 500_000, 2_000_000]

const TRANSACTIONS_PAGE_SIZE = 10

export const WalletPage: React.FC = () => {
  const toast = useToast()

  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTx, setIsLoadingTx] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState("Nap vi AI Tasker")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchWallet = useCallback(async () => {
    setErrorMsg(null)
    try {
      // Ví được tạo lazy ngay ở lần gọi này — user mới tinh vẫn nhận về ví 0đ, không phải 404.
      const data = await getMyWallet()
      setWallet(data)
      hasLoadedOnce.current = true
    } catch (err) {
      console.error(err)
      setErrorMsg(getApiErrorMessage(err, "Không tải được thông tin ví."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchTransactions = useCallback(async (nextPage: number) => {
    setIsLoadingTx(true)
    try {
      const data = await getWalletTransactions({ page: nextPage, pageSize: TRANSACTIONS_PAGE_SIZE })
      setTransactions(data)
    } catch (err) {
      // Sổ giao dịch là dữ liệu PHỤ — hỏng nó không được kéo cả màn ví xuống theo.
      console.error("Không tải được lịch sử giao dịch ví:", err)
      setTransactions([])
    } finally {
      setIsLoadingTx(false)
    }
  }, [])

  useEffect(() => {
    void fetchWallet()
  }, [fetchWallet])

  useEffect(() => {
    void fetchTransactions(page)
  }, [fetchTransactions, page])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchWallet(), fetchTransactions(page)])
  }, [fetchWallet, fetchTransactions, page])

  const polling = usePaymentOrderPolling(
    useCallback(
      (status) => {
        if (status === "Paid") {
          toast.success("Nạp tiền thành công!", "Số dư ví đã được cập nhật.")
          void refreshAll()
          return
        }
        if (status === "Expired") {
          toast.error("Đơn nạp đã hết hạn.", "Link thanh toán không còn hiệu lực, hãy tạo đơn mới.")
          return
        }
        toast.info("Đơn nạp đã bị huỷ.", "Không có khoản tiền nào bị trừ.")
      },
      [refreshAll, toast]
    )
  )

  // --- Validate ngay tại form: BE trả 422 cho đúng những ca này, chặn trước đỡ mất một vòng ---
  const trimmedDescription = description.trim()
  const amountError = (() => {
    if (!amount) return null
    if (amount < MIN_DEPOSIT_AMOUNT) return `Số tiền nạp tối thiểu là ${formatVnd(MIN_DEPOSIT_AMOUNT)}.`
    if (amount > MAX_AMOUNT) return `Số tiền nạp tối đa là ${formatVnd(MAX_AMOUNT)}.`
    return null
  })()
  const descriptionError = (() => {
    if (!trimmedDescription) return "Nội dung chuyển khoản không được để trống."
    if (description.length > MAX_DESCRIPTION_LENGTH)
      return `Tối đa ${MAX_DESCRIPTION_LENGTH} ký tự (giới hạn của PayOS).`
    return null
  })()
  const canSubmit =
    amount >= MIN_DEPOSIT_AMOUNT && amount <= MAX_AMOUNT && !descriptionError && !isSubmitting

  const handleCreateLink = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      const order = await createPaymentLink({
        amount,
        description: trimmedDescription,
        // PayOS đưa người dùng quay lại đúng màn ví sau khi thanh toán xong / bấm huỷ.
        returnUrl: window.location.href,
        cancelUrl: window.location.href,
      })

      if (!order?.checkoutUrl) {
        toast.error("Không tạo được link thanh toán.", "PayOS không trả về đường dẫn thanh toán.")
        return
      }

      // Mở tab mới thay vì điều hướng cả trang: tab này còn phải poll trạng thái đơn, mà
      // webhook PayOS không gọi được vào localhost nên poll là đường chốt tiền duy nhất.
      window.open(order.checkoutUrl, "_blank", "noopener,noreferrer")
      void polling.startTracking({
        orderCode: order.orderCode,
        amount: order.amount,
        description: order.description,
        checkoutUrl: order.checkoutUrl,
      })
      toast.info(
        "Đã mở trang thanh toán PayOS.",
        "Hoàn tất thanh toán ở tab vừa mở, số dư sẽ tự cập nhật tại đây."
      )
    } catch (err) {
      console.error(err)
      toast.error("Tạo đơn nạp thất bại.", getApiErrorMessage(err, "Vui lòng thử lại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && !hasLoadedOnce.current) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 w-full rounded-xl bg-muted" />
        <div className="h-64 w-full rounded-xl bg-muted" />
      </div>
    )
  }

  if (errorMsg && !wallet) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold text-foreground">Không tải được ví</h3>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <Button onClick={() => void fetchWallet()} variant="outline">
          Thử lại
        </Button>
      </div>
    )
  }

  const available = wallet?.availableBalance ?? 0
  const locked = wallet?.lockedBalance ?? 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ví của tôi</h1>
          <p className="mt-1 text-muted-foreground">
            Nạp tiền vào ví để ký quỹ dự án, và rút phần đã nhận về tài khoản ngân hàng.
          </p>
        </div>
        <Button onClick={() => void refreshAll()} variant="outline" size="sm" className="gap-1.5 self-start">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {/* Số dư */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Số dư khả dụng</p>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-primary">{formatVnd(available)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dùng để nạp ký quỹ cho dự án hoặc tạo yêu cầu rút tiền.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 text-amber-600">
            <Lock className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Đang tạm giữ</p>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">{formatVnd(locked)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tiền của các yêu cầu rút đang chờ Admin duyệt. Bị từ chối thì tiền quay lại số dư khả dụng.
          </p>
        </div>
      </div>

      {/* Đơn nạp đang chờ thanh toán */}
      {polling.order && (
        <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-2.5">
            {polling.exhausted ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            ) : (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-foreground">
                {polling.exhausted
                  ? "Chưa ghi nhận được thanh toán"
                  : "Đang chờ bạn hoàn tất thanh toán"}
              </p>
              <p className="text-xs text-muted-foreground">
                Đơn nạp <strong>{formatVnd(polling.order.amount)}</strong> • Mã đơn{" "}
                <span className="font-mono">{polling.order.orderCode}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {polling.exhausted
                  ? "Đơn vẫn ở trạng thái chờ. Nếu bạn đã thanh toán xong, bấm “Kiểm tra lại”. Nếu chưa, mở lại trang thanh toán để tiếp tục — tiền chưa bị trừ."
                  : "Số dư sẽ tự cập nhật ngay khi PayOS xác nhận. Bạn có thể để yên trang này."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void polling.recheck()}
              disabled={polling.isChecking}
              size="sm"
              variant="outline"
              className="gap-1.5"
            >
              {polling.isChecking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Kiểm tra lại
            </Button>
            {polling.order.checkoutUrl && (
              <a
                href={polling.order.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Mở lại trang thanh toán
              </a>
            )}
            <Button
              onClick={polling.clearOrder}
              size="sm"
              variant="outline"
              className="text-muted-foreground"
            >
              Bỏ theo dõi đơn này
            </Button>
          </div>
        </div>
      )}

      {/* Form nạp tiền */}
      <form
        onSubmit={handleCreateLink}
        className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-1.5 border-b border-border/60 pb-3 text-base font-bold">
          <PlusCircle className="h-5 w-5 text-primary" />
          Nạp tiền vào ví qua PayOS
        </h2>

        <div>
          <label htmlFor="deposit-amount" className="mb-1.5 block text-sm font-semibold">
            Số tiền nạp
          </label>
          <input
            id="deposit-amount"
            type="number"
            required
            min={MIN_DEPOSIT_AMOUNT}
            max={MAX_AMOUNT}
            step={1000}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={String(MIN_DEPOSIT_AMOUNT)}
            aria-describedby="deposit-amount-hint"
          />
          <p id="deposit-amount-hint" className="mt-1 text-xs text-muted-foreground">
            Từ {formatVnd(MIN_DEPOSIT_AMOUNT)} đến {formatVnd(MAX_AMOUNT)}.
          </p>
          {amountError && <p className="mt-1 text-xs font-semibold text-destructive">{amountError}</p>}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setAmount(quick)}
                className="rounded-md border border-border bg-secondary/30 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-secondary"
              >
                {formatVnd(quick)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="deposit-description" className="block text-sm font-semibold">
              Nội dung chuyển khoản
            </label>
            {/* Bộ đếm ký tự: 25 là trần CỨNG của PayOS, vượt là đơn không tạo được. */}
            <span
              className={`text-xs font-semibold ${
                description.length > MAX_DESCRIPTION_LENGTH
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
          <input
            id="deposit-description"
            type="text"
            required
            maxLength={MAX_DESCRIPTION_LENGTH}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nap vi AI Tasker"
            aria-describedby="deposit-description-hint"
          />
          <p id="deposit-description-hint" className="mt-1 text-xs text-muted-foreground">
            PayOS chỉ cho tối đa {MAX_DESCRIPTION_LENGTH} ký tự — nên viết ngắn, không dấu.
          </p>
          {descriptionError && description.length > 0 && (
            <p className="mt-1 text-xs font-semibold text-destructive">{descriptionError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Link
            to="/wallet/withdrawals"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowDownLeft className="h-4 w-4" />
            Rút tiền về ngân hàng
          </Link>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-primary font-semibold text-primary-foreground"
          >
            {isSubmitting ? "Đang tạo đơn..." : "Tạo đơn & thanh toán"}
          </Button>
        </div>
      </form>

      {/* Sổ giao dịch */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="border-b border-border/60 pb-3 text-base font-bold">Lịch sử giao dịch ví</h2>

        <WalletTransactionList transactions={transactions} isLoading={isLoadingTx} />

        {/* BE trả mảng phẳng, không kèm tổng số dòng — nên chỉ suy được "còn trang sau"
            từ việc trang hiện tại có đầy hay không, không hiện được "trang X/Y". */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoadingTx}
            variant="outline"
            size="sm"
          >
            Trang trước
          </Button>
          <span className="text-xs text-muted-foreground">Trang {page}</span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={transactions.length < TRANSACTIONS_PAGE_SIZE || isLoadingTx}
            variant="outline"
            size="sm"
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  )
}
