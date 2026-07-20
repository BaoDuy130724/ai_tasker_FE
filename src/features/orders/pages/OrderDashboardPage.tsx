import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { getProjects } from "@/features/contracts-projects/api"
import type { Project } from "@/features/contracts-projects/types"
import { UserLink } from "@/shared/components/UserLink"
import { ShoppingBag, DollarSign, Calendar, ArrowRight, Activity } from "lucide-react"

const getStatusStyle = (statusName: string) => {
  switch (statusName) {
    case "Created":
      return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    case "InProgress":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "Delivered":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    case "Approved":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "Closed":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

/**
 * "Đơn mua dịch vụ" = Project có ServiceId (tạo từ Marketplace, xem purchaseService) — không có
 * entity Order riêng (quyết định kiến trúc leader team 2026-07-20). Toàn bộ luồng tiến độ/giải ngân
 * sau khi mua (milestone, deliverable, escrow) đều xử lý ở trang chi tiết Dự án, không lặp lại ở đây.
 */
export const OrderDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchOrders = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await getProjects()
      setProjects(data.filter((p) => p.serviceId != null))
    } catch (error) {
      console.error("Lỗi fetch đơn mua dịch vụ:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  const isClient = user && user.role === "Client"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {isClient ? "Lịch sử mua dịch vụ AI" : "Đơn đặt hàng dịch vụ AI"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isClient
            ? "Theo dõi tiến độ triển khai các gói giải pháp AI bạn đã đặt mua."
            : "Các đơn khách hàng đặt mua gói dịch vụ của bạn."}
        </p>
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
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Chưa có đơn hàng nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            {isClient
              ? "Hãy khám phá Marketplace để đặt mua các gói giải pháp thông minh đầu tiên."
              : "Các đơn đặt hàng từ khách hàng sẽ xuất hiện tại đây."}
          </p>
          {isClient && (
            <Link to="/marketplace" className="mt-4 text-primary hover:underline text-sm font-semibold">
              Khám phá Marketplace →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Đơn hàng #{project.id} · Dịch vụ #{project.serviceId}
                  </h3>
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusStyle(project.statusName)}`}>
                    {project.statusName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <strong className="text-foreground">${project.proposedPrice}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(project.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    {isClient ? "Expert:" : "Client:"}
                    <UserLink userId={isClient ? project.expertId : project.clientId} className="font-semibold hover:underline" />
                  </span>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
