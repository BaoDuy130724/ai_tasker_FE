import React, { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useSafeBack } from "@/shared/hooks/useSafeBack"
import { getServiceById } from "@/features/marketplace/api"
import type { AiService } from "@/features/marketplace/types"
import { purchaseService, type ApproveProposalResult } from "@/features/contracts-projects/api"
import { ContractSignedModal } from "@/features/contracts-projects/components/ContractSignedModal"
import { UserLink } from "@/shared/components/UserLink"
import { getApiErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, ArrowLeft, ShieldAlert, ShoppingBag } from "lucide-react"

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const goBack = useSafeBack()
  const [searchParams] = useSearchParams()
  const serviceIdStr = searchParams.get("serviceId")
  const serviceId = serviceIdStr ? Number(serviceIdStr) : null

  const [service, setService] = useState<AiService | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [purchased, setPurchased] = useState<ApproveProposalResult | null>(null)

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setErrorMsg("Không tìm thấy mã gói dịch vụ AI hợp lệ.")
        setIsLoading(false)
        return
      }
      try {
        const data = await getServiceById(serviceId)
        setService(data)
      } catch (err) {
        console.error(err)
        setErrorMsg("Lỗi tải thông tin gói dịch vụ AI.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchService()
  }, [serviceId])

  const handleConfirmPurchase = async () => {
    if (!service) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const result = await purchaseService(service.id)
      if (result) setPurchased(result)
    } catch (err) {
      console.error(err)
      setErrorMsg(getApiErrorMessage(err, "Đặt mua dịch vụ thất bại. Vui lòng thử lại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Không tải được dịch vụ</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Lỗi tải thông tin."}</p>
        <Button onClick={goBack} variant="outline" className="flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Xác Nhận Đặt Mua Gói Dịch Vụ</h1>
        <p className="text-muted-foreground mt-1">
          Mua thẳng gói này sẽ tạo ngay 1 Hợp đồng &amp; Dự án — bạn tạo milestone và mô tả yêu cầu chi
          tiết ở trang Dự án sau khi mua.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
        <div className="space-y-1">
          <h4 className="font-bold text-lg text-primary">{service.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{service.description}</p>
        </div>

        <div className="space-y-2.5 text-sm border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Đơn giá trọn gói
            </span>
            <strong className="text-foreground">${service.price} USD</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" /> Thời gian bàn giao
            </span>
            <strong className="text-foreground">{service.deliveryTimeDays} ngày</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Expert phụ trách</span>
            <UserLink userId={service.expertId} className="font-semibold hover:underline" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={goBack} className="border-border hover:bg-secondary transition-all">
            Hủy
          </Button>
          <Button
            onClick={handleConfirmPurchase}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm flex items-center gap-1.5"
          >
            <ShoppingBag className="h-4 w-4" />
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt mua"}
          </Button>
        </div>
      </div>

      {purchased && (
        <ContractSignedModal
          contract={purchased.contract}
          onGoToProject={() => navigate(`/projects/${purchased.project.id}`)}
        />
      )}
    </div>
  )
}
