import React, { useEffect, useState } from "react"
import { useAuthStore } from "@/features/auth/store"
import { orderStore } from "../store"
import type { Order } from "../types"
import { OrderStatus } from "../types"
import { Button } from "@/components/ui/button"
import { ShoppingBag, DollarSign, Calendar, Award, User } from "lucide-react"

export const OrderDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchOrders = () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = user.role === "Client"
        ? orderStore.getOrdersByClient(Number(user.id))
        : orderStore.getOrdersByExpert(Number(user.id))
      setOrders(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  const handleUpdateStatus = (id: string, status: OrderStatus) => {
    const success = orderStore.updateOrderStatus(id, status)
    if (success) {
      alert("Cập nhật trạng thái đơn hàng thành công!")
      fetchOrders()
    }
  }

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
      case OrderStatus.InProgress:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case OrderStatus.Completed:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case OrderStatus.Cancelled:
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const isClient = user && user.role === "Client"
  const isExpert = user && user.role === "Expert"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {isClient ? "Lịch sử mua dịch vụ AI" : "Đơn đặt hàng dịch vụ AI"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isClient
            ? "Theo dõi tiến độ triển khai các gói giải pháp AI bạn đã đặt mua."
            : "Quản lý và cập nhật tiến độ bàn giao sản phẩm cho khách hàng."}
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
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Chưa có đơn hàng nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            {isClient
              ? "Hãy khám phá Marketplace để đặt mua các gói giải pháp thông minh đầu tiên."
              : "Các đơn đặt hàng từ khách hàng sẽ xuất hiện tại đây."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Mã đơn hàng: {order.id}</span>
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusStyle(order.status)}`}>
                      {order.statusName}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-primary">{order.serviceTitle}</h3>
                </div>

                <div className="flex items-center gap-1.5 font-extrabold text-lg text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-xl">
                  <DollarSign className="h-4 w-4" />
                  {order.price} USD
                </div>
              </div>

              <div className="py-4 space-y-3">
                <div className="text-sm leading-relaxed bg-secondary/20 p-4 rounded-lg border">
                  <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Yêu cầu điều khoản đặt hàng:</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{order.terms}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Hạn bàn giao: {new Date(order.deadline).toLocaleDateString("vi-VN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {isClient ? `Expert ID: #${order.expertId}` : `Client ID: #${order.clientId}`}
                  </span>
                  <span>Ngày tạo: {new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>

              {/* Actions for Expert */}
              {isExpert && (
                <div className="flex justify-end gap-2 border-t border-border/40 pt-4 mt-2">
                  {order.status === OrderStatus.Pending && (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.Cancelled)}
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold"
                      >
                        Từ chối
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.InProgress)}
                        size="sm"
                        className="bg-primary text-primary-foreground font-semibold"
                      >
                        Chấp nhận & Tiến hành
                      </Button>
                    </>
                  )}

                  {order.status === OrderStatus.InProgress && (
                    <Button
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.Completed)}
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Award className="h-4 w-4" />
                      Hoàn thành & Bàn giao sản phẩm
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
