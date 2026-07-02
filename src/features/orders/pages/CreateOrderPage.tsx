import React, { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getServiceById } from "@/features/marketplace/api"
import type { AiService } from "@/features/marketplace/types"
import { useAuthStore } from "@/features/auth/store"
import { orderStore } from "../store"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Calendar, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react"

const orderSchema = z.object({
  terms: z.string().min(10, { message: "Vui lòng nhập chi tiết yêu cầu tối thiểu 10 ký tự" }),
  deadline: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Thời gian bàn giao phải là trong tương lai",
  }),
})

type OrderFormValues = z.infer<typeof orderSchema>

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const serviceIdStr = searchParams.get("serviceId")
  const serviceId = serviceIdStr ? Number(serviceIdStr) : null

  const { user } = useAuthStore()
  const [service, setService] = useState<AiService | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      terms: "",
      deadline: "",
    },
  })

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

  const onSubmit = async (values: OrderFormValues) => {
    if (!service || !user) return
    setIsSubmitting(true)
    try {
      orderStore.createOrder({
        serviceId: service.id,
        serviceTitle: service.title,
        clientId: Number(user.id),
        expertId: service.expertId,
        price: service.price,
        terms: values.terms,
        deadline: values.deadline,
      })
      alert("Đặt mua dịch vụ AI thành công! Đang chờ Expert phê duyệt.")
      navigate("/client/orders")
    } catch (err) {
      console.error(err)
      setErrorMsg("Không thể đặt mua gói dịch vụ.")
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

  if (errorMsg || !service) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Không tải được dịch vụ</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Lỗi tải thông tin."}</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Summary */}
      <div className="lg:col-span-1 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-base border-b pb-3">Chi tiết gói đặt mua</h3>
          
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-primary">{service.title}</h4>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Đơn giá trọn gói: <strong>${service.price} USD</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Thời gian giao hàng: {service.deliveryTimeDays} ngày
              </p>
              <p className="text-xs">Expert ID: #{service.expertId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Xác Nhận Đặt Mua Gói Dịch Vụ</h1>
          <p className="text-muted-foreground mt-1">Vui lòng mô tả yêu cầu điều khoản riêng của bạn và ngày mong muốn bàn giao.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Hạn chót mong muốn bàn giao (Deadline)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="date"
                {...register("deadline")}
                className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.deadline ? "border-destructive focus:ring-destructive" : "border-input"
                }`}
              />
            </div>
            {errors.deadline && (
              <p className="mt-1 text-xs text-destructive">{errors.deadline.message}</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Yêu cầu chi tiết & Mô tả điều khoản của bạn
            </label>
            <textarea
              rows={6}
              {...register("terms")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all leading-relaxed ${
                errors.terms ? "border-destructive focus:ring-destructive" : "border-input"
              }`}
              placeholder="Nhập cụ thể các đầu ra mong muốn, các cấu hình bạn cần và ghi chú đặc biệt cho Expert..."
            />
            {errors.terms && (
              <p className="mt-1 text-xs text-destructive">{errors.terms.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-border hover:bg-secondary transition-all"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
