import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/ui/use-toast"
import { useConfirm, usePrompt } from "@/shared/ui/use-confirm"
import { getApiErrorMessage } from "@/lib/utils"
import { approveWithdrawal, getPendingWithdrawals, rejectWithdrawal } from "../api"
import type { WithdrawalRequest } from "../types"
import { formatDateTime, formatVnd } from "../currency"
import { UserLink } from "@/shared/components/UserLink"
import { Banknote, CheckCircle, Landmark, RefreshCw, XCircle } from "lucide-react"

export const AdminWithdrawalPage: React.FC = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()

  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const hasLoadedOnce = useRef(false)

  const fetchPending = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPendingWithdrawals()
      setRequests(data)
      hasLoadedOnce.current = true
    } catch (err) {
      console.error(err)
      toast.error("Không tải được danh sách yêu cầu.", getApiErrorMessage(err, "Vui lòng thử lại."))
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchPending()
  }, [fetchPending])

  const handleApprove = async (request: WithdrawalRequest) => {
    // Duyệt = trừ HẲN phần tạm giữ. Hệ thống KHÔNG tự chuyển khoản — Admin phải tự làm
    // bên ngoài. Nói thẳng điều đó ra trước khi bấm, nếu không tiền biến mất mà người
    // nhận chẳng thấy gì.
    const ok = await confirm({
      title: `Duyệt yêu cầu rút ${formatVnd(request.amount)}?`,
      description:
        `Bạn phải TỰ chuyển khoản ${formatVnd(request.amount)} tới ${request.bankName} — ` +
        `${request.bankAccountNo} (${request.bankAccountName}). Sau khi duyệt, số tiền bị trừ hẳn ` +
        "khỏi ví người dùng và không thể hoàn tác trong hệ thống.",
      confirmText: "Đã chuyển khoản, duyệt",
      variant: "warning",
    })
    if (!ok) return

    setProcessingId(request.id)
    try {
      await approveWithdrawal(request.id)
      toast.success("Đã duyệt yêu cầu rút tiền.")
      await fetchPending()
    } catch (err) {
      console.error(err)
      toast.error("Duyệt yêu cầu thất bại.", getApiErrorMessage(err, "Vui lòng thử lại."))
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (request: WithdrawalRequest) => {
    const reason = await prompt({
      title: `Từ chối yêu cầu rút ${formatVnd(request.amount)}?`,
      description: "Tiền sẽ được trả lại vào số dư khả dụng của người dùng. Lý do sẽ hiện cho họ.",
      label: "Lý do từ chối",
      placeholder: "VD: Thông tin tài khoản ngân hàng không khớp với chủ tài khoản.",
      confirmText: "Từ chối",
      variant: "destructive",
      multiline: true,
    })
    if (!reason) return

    setProcessingId(request.id)
    try {
      await rejectWithdrawal(request.id, reason)
      toast.success("Đã từ chối yêu cầu.", "Tiền đã được trả về số dư khả dụng của người dùng.")
      await fetchPending()
    } catch (err) {
      console.error(err)
      toast.error("Từ chối yêu cầu thất bại.", getApiErrorMessage(err, "Vui lòng thử lại."))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Duyệt rút tiền</h1>
          <p className="mt-1 text-muted-foreground">
            Các yêu cầu rút tiền về ngân hàng đang chờ xử lý. Việc chuyển khoản thực hiện thủ công
            bên ngoài hệ thống.
          </p>
        </div>
        <Button onClick={() => void fetchPending()} variant="outline" size="sm" className="gap-1.5 self-start">
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {(() => {
        if (isLoading && !hasLoadedOnce.current) {
          return (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border bg-card" />
              ))}
            </div>
          )
        }

        if (requests.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
              <Banknote className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="text-lg font-bold text-foreground">Không có yêu cầu nào chờ duyệt</h3>
              <p className="mt-1 max-w-[320px] text-sm text-muted-foreground">
                Khi người dùng gửi yêu cầu rút tiền về ngân hàng, yêu cầu sẽ xuất hiện ở đây.
              </p>
            </div>
          )
        }

        return (
          <ul className="space-y-4">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-foreground">
                        {formatVnd(r.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">#{r.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Người yêu cầu:{" "}
                      <UserLink
                        userId={r.userId}
                        className="inline text-xs font-semibold text-primary hover:underline"
                      />{" "}
                      • Gửi lúc {formatDateTime(r.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => void handleReject(r)}
                      disabled={processingId === r.id}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Từ chối
                    </Button>
                    <Button
                      onClick={() => void handleApprove(r)}
                      disabled={processingId === r.id}
                      size="sm"
                      className="flex items-center gap-1 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Duyệt
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 rounded-lg border border-border/50 bg-secondary/20 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" />
                    Thông tin chuyển khoản
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Ngân hàng:</span>{" "}
                    <strong>{r.bankName}</strong>
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Số tài khoản:</span>{" "}
                    <strong className="font-mono">{r.bankAccountNo}</strong>
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>{" "}
                    <strong>{r.bankAccountName}</strong>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      })()}
    </div>
  )
}
