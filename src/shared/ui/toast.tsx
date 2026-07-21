import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { ToastContext, type ToastApi, type ToastVariant } from "./use-toast"

export interface ToastOptions {
  title: string
  /** Dòng phụ, dùng cho message chi tiết từ API. */
  description?: string
  /** Mặc định: 5s, riêng lỗi 7s vì người dùng cần thời gian đọc. */
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  variant: ToastVariant
}

/** Tối đa 4 toast cùng lúc — nhiều hơn là spam, đẩy toast cũ nhất ra. */
const MAX_TOASTS = 4

const VARIANT_STYLE: Record<
  ToastVariant,
  { icon: React.ComponentType<{ className?: string }>; iconWrap: string; role: "status" | "alert" }
> = {
  // Dark theme dùng tông sáng hơn vì --destructive/--emerald gốc quá tối trên nền slate-950.
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    role: "status",
  },
  error: {
    icon: AlertTriangle,
    iconWrap: "bg-destructive/10 text-destructive dark:text-red-400",
    role: "alert",
  },
  info: {
    icon: Info,
    iconWrap: "bg-primary/10 text-primary",
    role: "status",
  },
}

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const { icon: Icon, iconWrap, role } = VARIANT_STYLE[toast.variant]
  const [isLeaving, setIsLeaving] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const dismiss = useCallback(() => {
    setIsLeaving(true)
    // Khớp thời lượng animate-out bên dưới; reduced-motion rút transition chứ không rút timeout,
    // nên vẫn cần chờ mới unmount.
    window.setTimeout(() => onDismiss(toast.id), 180)
  }, [onDismiss, toast.id])

  useEffect(() => {
    if (isPaused || isLeaving) return
    const timer = window.setTimeout(dismiss, toast.duration)
    return () => window.clearTimeout(timer)
    // isPaused đổi -> timer chạy lại từ đầu. Đơn giản hơn việc lưu thời gian còn lại,
    // và với toast thì việc "rê chuột ra thì đọc lại từ đầu" là hành vi chấp nhận được.
  }, [dismiss, toast.duration, isPaused, isLeaving])

  return (
    <div
      role={role}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-elevated p-4 shadow-lg shadow-black/5 dark:shadow-black/40 ${
        isLeaving
          ? "animate-out fade-out slide-out-to-right-8 duration-150 ease-out"
          : "animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-right-8 duration-200 ease-out"
      }`}
    >
      <span className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${iconWrap}`}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold leading-snug text-elevated-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-xs leading-relaxed text-muted-foreground break-words">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Đóng thông báo"
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, title: string, description?: string) => {
    setToasts((prev) => {
      const item: ToastItem = {
        id: nextId.current++,
        variant,
        title,
        description,
        duration: variant === "error" ? 7000 : 5000,
      }
      return [...prev, item].slice(-MAX_TOASTS)
    })
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      info: (title, description) => push("info", title, description),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Container không bắt chuột để không chặn thao tác phía dưới; từng card mới bắt. */}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-toast flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
