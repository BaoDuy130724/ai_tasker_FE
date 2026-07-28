import React from "react"
import { History } from "lucide-react"
import type { WalletTransaction, WalletTransactionStatus, WalletTransactionType } from "../types"
import { formatDateTime, formatVnd } from "../currency"

/**
 * Nhãn tiếng Việt cho sổ cái ví. Payment trả CHUỖI (JsonStringEnumConverter) nên tra
 * theo key — khác escrow của Project vốn trả enum SỐ và phải tra theo index mảng.
 */
const TYPE_LABELS: Record<WalletTransactionType, string> = {
  Deposit: "Nạp tiền",
  Withdrawal: "Rút về ngân hàng",
  EscrowHold: "Nạp vào ký quỹ",
  EscrowRelease: "Nhận từ ký quỹ",
  EscrowRefund: "Hoàn từ ký quỹ",
}

/** Tiền VÀO ví hiện dấu +, tiền RA ví hiện dấu − — người dùng đọc sổ theo hướng này. */
const INCOMING: WalletTransactionType[] = ["Deposit", "EscrowRelease", "EscrowRefund"]

const STATUS_LABELS: Record<WalletTransactionStatus, string> = {
  Pending: "Đang xử lý",
  Completed: "Thành công",
  Failed: "Thất bại",
  Cancelled: "Đã huỷ",
}

const STATUS_STYLES: Record<WalletTransactionStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600",
  Completed: "bg-emerald-500/10 text-emerald-600",
  Failed: "bg-destructive/10 text-destructive",
  Cancelled: "bg-secondary text-muted-foreground",
}

interface WalletTransactionListProps {
  transactions: WalletTransaction[]
  isLoading: boolean
}

export const WalletTransactionList: React.FC<WalletTransactionListProps> = ({
  transactions,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary/30" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <History className="mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-semibold text-foreground">Chưa có giao dịch nào</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Mọi lần nạp, ký quỹ và rút tiền sẽ được ghi lại ở đây.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {transactions.map((tx) => {
        const isIncoming = INCOMING.includes(tx.type)
        return (
          <li
            key={tx.id}
            className="rounded-lg border border-border/50 bg-secondary/10 px-3.5 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      STATUS_STYLES[tx.status] ?? "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[tx.status] ?? tx.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(tx.createdAt)} • Mã: {tx.transactionCode}
                </p>
                {tx.description && (
                  <p className="break-words text-xs text-muted-foreground">{tx.description}</p>
                )}
              </div>

              <span
                className={`shrink-0 whitespace-nowrap text-sm font-bold ${
                  isIncoming ? "text-emerald-600" : "text-foreground"
                }`}
              >
                {isIncoming ? "+" : "−"}
                {formatVnd(tx.amount)}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
