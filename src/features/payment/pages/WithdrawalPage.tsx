import React, { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { getApiErrorMessage } from "@/lib/utils"
import { getMyWallet, getMyWithdrawals, requestWithdrawal } from "../api"
import { MAX_AMOUNT, type UserWallet, type WithdrawalRequest } from "../types"
import { formatDateTime, formatVnd } from "../currency"
import { WithdrawalStatusBadge } from "../components/WithdrawalStatusBadge"
import { AlertTriangle, ArrowDownLeft, Banknote, Info, Landmark, Wallet } from "lucide-react"

export const WithdrawalPage: React.FC = () => {
  const toast = useToast()

  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasLoadedOnce = useRef(false)

  const [form, setForm] = useState({
    amount: 0,
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
  })

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [walletData, requestData] = await Promise.all([getMyWallet(), getMyWithdrawals()])
      setWallet(walletData)
      setRequests(requestData)
      hasLoadedOnce.current = true
    } catch (err) {
      console.error(err)
      toast.error("Không tải được dữ liệu rút tiền.", getApiErrorMessage(err, "Vui lòng thử lại."))
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const available = wallet?.availableBalance ?? 0

  // --- Ràng buộc BE validate (sai là 422) ---
  const amountError = (() => {
    if (!form.amount) return null
    if (form.amount <= 0) return "Số tiền rút phải lớn hơn 0."
    if (form.amount > MAX_AMOUNT) return `Số tiền rút tối đa là ${formatVnd(MAX_AMOUNT)}.`
    // BE tự chặn (ví ném InvalidOperationException → 422), nhưng chặn ở đây thì người dùng
    // biết ngay lúc gõ thay vì sau khi bấm gửi.
    if (form.amount > available)
      return `Vượt quá số dư khả dụng (${formatVnd(available)}).`
    return null
  })()

  const accountNoError =
    form.bankAccountNo && !/^\d+$/.test(form.bankAccountNo)
      ? "Số tài khoản chỉ được chứa chữ số — không khoảng trắng, không dấu gạch."
      : null

  const canSubmit =
    form.amount > 0 &&
    !amountError &&
    !accountNoError &&
    form.bankName.trim().length > 0 &&
    form.bankAccountNo.length > 0 &&
    form.bankAccountName.trim().length > 0 &&
    !isSubmitting

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await requestWithdrawal({
        amount: form.amount,
        bankName: form.bankName.trim(),
        bankAccountNo: form.bankAccountNo,
        bankAccountName: form.bankAccountName.trim(),
      })
      toast.success(
        "Đã gửi yêu cầu rút tiền.",
        "Số tiền đã được tạm giữ và sẽ được chuyển khoản sau khi Admin duyệt."
      )
      setForm({ amount: 0, bankName: "", bankAccountNo: "", bankAccountName: "" })
      await fetchAll()
    } catch (err) {
      console.error(err)
      toast.error("Gửi yêu cầu rút tiền thất bại.", getApiErrorMessage(err, "Vui lòng thử lại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && !hasLoadedOnce.current) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-56 rounded bg-muted" />
        <div className="h-24 w-full rounded-xl bg-muted" />
        <div className="h-72 w-full rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Rút tiền về ngân hàng</h1>
        <p className="mt-1 text-muted-foreground">
          Chuyển tiền từ ví AI Tasker về tài khoản ngân hàng của bạn. Yêu cầu cần Admin duyệt trước
          khi được chuyển khoản.
        </p>
      </div>

      {/* Số dư + lối quay lại ví */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Số dư khả dụng</p>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-primary">{formatVnd(available)}</p>
        </div>
        <Link
          to="/wallet"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Về màn hình ví
        </Link>
      </div>

      {/* Nhắc rõ 2 bước — đây là chỗ người dùng hay tưởng escrow đã trả thẳng về ngân hàng */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Tiền từ dự án đi qua <strong>hai bước</strong>: rút từ ký quỹ của dự án về ví trước, rồi
          mới từ ví về ngân hàng ở màn hình này. Ở bước rút ký quỹ, tiền chỉ chuyển sang ví — chưa
          hề rời khỏi hệ thống.
        </p>
      </div>

      {/* Form tạo yêu cầu */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-1.5 border-b border-border/60 pb-3 text-base font-bold">
          <ArrowDownLeft className="h-5 w-5 text-primary" />
          Tạo yêu cầu rút tiền
        </h2>

        <div>
          <label htmlFor="withdraw-amount" className="mb-1.5 block text-sm font-semibold">
            Số tiền muốn rút
          </label>
          <input
            id="withdraw-amount"
            type="number"
            required
            min={1}
            max={Math.min(available, MAX_AMOUNT)}
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="100000"
          />
          {amountError ? (
            <p className="mt-1 text-xs font-semibold text-destructive">{amountError}</p>
          ) : (
            <button
              type="button"
              onClick={() => setForm({ ...form, amount: Math.min(available, MAX_AMOUNT) })}
              disabled={available <= 0}
              className="mt-1.5 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              Rút toàn bộ số dư khả dụng
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="withdraw-bank-name" className="mb-1.5 block text-sm font-semibold">
              Tên ngân hàng
            </label>
            <input
              id="withdraw-bank-name"
              type="text"
              required
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Vietcombank"
            />
          </div>

          <div>
            <label htmlFor="withdraw-account-no" className="mb-1.5 block text-sm font-semibold">
              Số tài khoản
            </label>
            <input
              id="withdraw-account-no"
              type="text"
              required
              inputMode="numeric"
              value={form.bankAccountNo}
              // Lọc ngay lúc gõ: BE chỉ nhận CHỮ SỐ, dán từ app ngân hàng hay dính khoảng trắng.
              onChange={(e) =>
                setForm({ ...form, bankAccountNo: e.target.value.replace(/\D/g, "") })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0123456789"
              aria-describedby="withdraw-account-no-hint"
            />
            <p id="withdraw-account-no-hint" className="mt-1 text-xs text-muted-foreground">
              Chỉ chữ số.
            </p>
            {accountNoError && (
              <p className="mt-1 text-xs font-semibold text-destructive">{accountNoError}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="withdraw-account-name" className="mb-1.5 block text-sm font-semibold">
            Tên chủ tài khoản
          </label>
          <input
            id="withdraw-account-name"
            type="text"
            required
            value={form.bankAccountName}
            onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="NGUYEN VAN A"
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Số tiền sẽ được <strong>tạm giữ ngay</strong> khi bạn gửi yêu cầu (chuyển từ khả dụng
            sang tạm giữ). Nếu Admin từ chối, tiền quay lại số dư khả dụng. Hãy kiểm tra kỹ thông
            tin ngân hàng — chuyển nhầm thì hệ thống không thu hồi được.
          </p>
        </div>

        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button type="submit" disabled={!canSubmit} className="bg-primary font-semibold text-primary-foreground">
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
          </Button>
        </div>
      </form>

      {/* Lịch sử yêu cầu */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-1.5 border-b border-border/60 pb-3 text-base font-bold">
          <Landmark className="h-5 w-5 text-primary" />
          Yêu cầu rút tiền của tôi
        </h2>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Banknote className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">Chưa có yêu cầu rút tiền nào</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-lg border border-border/50 bg-secondary/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">
                        {formatVnd(r.amount)}
                      </span>
                      <WithdrawalStatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.bankName} • {r.bankAccountNo} • {r.bankAccountName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gửi lúc {formatDateTime(r.createdAt)}
                      {r.processedAt && ` • Xử lý lúc ${formatDateTime(r.processedAt)}`}
                    </p>
                  </div>
                </div>

                {r.status === "Rejected" && r.reason && (
                  <p className="mt-2 rounded border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
                    <strong>Lý do từ chối:</strong> {r.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
