import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { getServices, deleteService } from "../api"
import type { AiService } from "../types"
import { Button } from "@/components/ui/button"
import { Layers, DollarSign, Clock, PlusCircle, Trash2, Pencil } from "lucide-react"
import { useToast } from "@/shared/ui/toast"
import { useConfirm } from "@/shared/ui/confirm-dialog"

export const ExpertServiceListPage: React.FC = () => {
  const { user } = useAuthStore()
  const toast = useToast()
  const confirm = useConfirm()
  const [myServices, setMyServices] = useState<AiService[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMyServices = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await getServices({
        pageSize: 100, // Lấy trang đầu với số lượng lớn để filter
      })
      const items = data?.items || data || []
      const filtered = items.filter((s: AiService) => s.expertId === Number(user.id))
      setMyServices(filtered)
    } catch (err) {
      console.error("Lỗi fetch expert services:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMyServices()
  }, [user])

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Xoá gói dịch vụ này?",
      description: "Gói sẽ bị gỡ khỏi Marketplace và không thể khôi phục.",
      confirmText: "Xoá gói",
      variant: "destructive",
    })
    if (!ok) return
    try {
      await deleteService(id)
      toast.success("Đã xóa gói dịch vụ thành công!")
      await fetchMyServices()
    } catch (err) {
      console.error(err)
      toast.error("Xóa gói dịch vụ thất bại.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gói Dịch Vụ AI Của Tôi</h1>
          <p className="text-muted-foreground mt-1">Đăng bán và quản lý các gói giải pháp AI cá nhân trên Marketplace.</p>
        </div>
        <Link to="/expert/services/new">
          <Button className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            Đăng dịch vụ mới
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-5 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : myServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Bạn chưa đăng gói dịch vụ nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Đăng các gói dịch vụ thông minh để kiếm tiền từ chuyên môn của bạn.
          </p>
          <Link to="/expert/services/new" className="mt-4">
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Đăng ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {myServices.map((service) => (
            <div key={service.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">{service.title}</h3>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[9px] font-semibold border border-emerald-500/20 uppercase">
                    {service.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-primary" />
                    Đơn giá: <strong>${service.price}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Thời gian giao: {service.deliveryTimeDays} ngày
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {service.skills?.map((s) => (
                    <span key={s} className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground border border-border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Link to={`/marketplace/services/${service.id}`} className="w-full md:w-auto">
                  <Button variant="outline" size="sm" className="w-full border-border hover:bg-secondary text-xs">
                    Xem demo
                  </Button>
                </Link>
                <Link to={`/expert/services/${service.id}/edit`} className="w-full md:w-auto">
                  <Button variant="outline" size="sm" className="w-full border-border hover:bg-secondary text-xs flex items-center gap-1">
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                </Link>
                <Button
                  onClick={() => handleDelete(service.id)}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto border-destructive/20 text-destructive hover:bg-destructive/10 text-xs flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
