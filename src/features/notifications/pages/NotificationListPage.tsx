import React, { useEffect, useRef } from "react"
import { useNotificationStore } from "../store"
import { Button } from "@/components/ui/button"
import { Bell, Check, Clock, ExternalLink, Briefcase, Star, CheckCircle, DollarSign, ShieldAlert, MessageSquare } from "lucide-react"

// BE ghi EventType = routing key RabbitMQ thật (vd "project.assigned", "review.created" — xem
// RabbitMqConsumerService.cs), không phải chuỗi PascalCase. Match theo tiền tố để chịu được
// event mới phát sinh (Job/Marketplace publisher vẫn ⏳ chưa xong ở BE — xem FE_PLAN mục 4).
const getEventVisual = (eventType: string): { icon: React.ReactNode; className: string } => {
  const prefix = eventType?.split(".")[0] || ""
  switch (prefix) {
    case "project":
      return { icon: <Briefcase className="h-4 w-4" />, className: "bg-blue-500/10 text-blue-600" }
    case "review":
      return { icon: <Star className="h-4 w-4" />, className: "bg-amber-500/10 text-amber-600" }
    case "job":
      return { icon: <Briefcase className="h-4 w-4" />, className: "bg-indigo-500/10 text-indigo-600" }
    case "milestone":
      return { icon: <CheckCircle className="h-4 w-4" />, className: "bg-emerald-500/10 text-emerald-600" }
    case "escrow":
      return { icon: <DollarSign className="h-4 w-4" />, className: "bg-emerald-500/10 text-emerald-600" }
    case "dispute":
      return { icon: <ShieldAlert className="h-4 w-4" />, className: "bg-destructive/10 text-destructive" }
    case "message":
      return { icon: <MessageSquare className="h-4 w-4" />, className: "bg-primary/10 text-primary" }
    default:
      return { icon: <Bell className="h-4 w-4" />, className: "bg-primary/10 text-primary" }
  }
}

export const NotificationListPage: React.FC = () => {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore()
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    fetchNotifications().then(() => {
      hasLoadedOnce.current = true
    })
  }, [fetchNotifications])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Thông báo</h1>
          <p className="text-muted-foreground mt-1">Cập nhật các hoạt động mới nhất liên quan đến bạn.</p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold border-border hover:bg-secondary transition-all"
          >
            <Check className="h-4 w-4" />
            Đọc tất cả
          </Button>
        )}
      </div>

      {(() => {
        if (isLoading && !hasLoadedOnce.current) {
          return (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="h-4 w-1/4 rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          )
        }
        if (notifications.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Bạn chưa có thông báo nào</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                Khi có cập nhật mới về công việc, proposal hoặc hợp đồng, thông báo sẽ xuất hiện ở đây.
              </p>
            </div>
          )
        }
        return (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {notifications.map((n) => {
              const visual = getEventVisual(n.eventType)
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !n.isRead) {
                      markAsRead(n.id)
                    }
                  }}
                  className={`p-5 transition-all cursor-pointer flex gap-4 items-start ${
                    n.isRead ? "bg-card opacity-70 hover:bg-secondary/20" : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className={`mt-1 rounded-full p-2 ${n.isRead ? "bg-secondary text-muted-foreground" : visual.className}`}>
                    {visual.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-bold text-foreground">
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {formatDate(n.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {n.message}
                    </p>
                    {n.actionUrl && (
                      <a
                        href={n.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Xem chi tiết
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
