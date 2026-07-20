import React from "react"
import { FileSignature, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Contract } from "../types"

interface ContractSignedModalProps {
  contract: Contract
  onGoToProject: () => void
}

/**
 * BE không có endpoint GET lại Contract sau khi tạo (cả 2 luồng: approve-proposal và
 * purchase-service) — đây là cơ hội DUY NHẤT thấy điều khoản hợp đồng, nên hiện ngay trong
 * modal thay vì âm thầm bỏ qua rồi điều hướng thẳng.
 */
export const ContractSignedModal: React.FC<ContractSignedModalProps> = ({ contract, onGoToProject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <FileSignature className="h-5 w-5" />
            Hợp đồng đã được kích hoạt
          </div>
          <button
            className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
            onClick={onGoToProject}
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mã hợp đồng</span>
            <strong className="text-foreground">#{contract.id}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngày ký</span>
            <strong className="text-foreground">{new Date(contract.signedAt).toLocaleString("vi-VN")}</strong>
          </div>
          {contract.proposedPrice != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giá trị hợp đồng</span>
              <strong className="text-foreground">${contract.proposedPrice}</strong>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-1">Điều khoản hợp đồng</p>
            <p className="rounded-lg border border-border bg-secondary/20 p-3 leading-relaxed whitespace-pre-wrap">
              {contract.terms || "(Không có điều khoản bổ sung)"}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={onGoToProject} className="bg-primary text-primary-foreground font-semibold">
            Đến trang Dự án
          </Button>
        </div>
      </div>
    </div>
  )
}
