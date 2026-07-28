import React from "react"
import type { WithdrawalStatus } from "../types"

const LABELS: Record<WithdrawalStatus, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã chuyển khoản",
  Rejected: "Bị từ chối",
}

const STYLES: Record<WithdrawalStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
}

export const WithdrawalStatusBadge: React.FC<{ status: WithdrawalStatus }> = ({ status }) => (
  <span
    className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
      STYLES[status] ?? "border-border bg-secondary text-muted-foreground"
    }`}
  >
    {LABELS[status] ?? status}
  </span>
)
