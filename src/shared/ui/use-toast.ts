import { createContext, useContext } from "react"

/**
 * Context + hook của Toast, tách khỏi `toast.tsx`.
 *
 * File component chỉ được export component thì Fast Refresh của Vite mới hoạt động;
 * để lẫn hook/constant vào đó sẽ khiến mọi lần sửa file làm mất state toàn cây con.
 */
export type ToastVariant = "success" | "error" | "info"

/**
 * Nút hành động trong toast — dành cho lỗi mà người dùng TỰ SỬA ĐƯỢC và lối sửa nằm ở
 * màn khác ("ví thiếu tiền" → sang màn nạp ví). Không có nó thì thông báo chỉ nói được
 * "sai rồi" mà không chỉ được đường đi.
 *
 * Bấm nút cũng đóng luôn toast — người dùng đã rời khỏi ngữ cảnh của thông báo đó.
 */
export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastApi {
  success: (title: string, description?: string, action?: ToastAction) => void
  error: (title: string, description?: string, action?: ToastAction) => void
  info: (title: string, description?: string, action?: ToastAction) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast phải nằm trong <ToastProvider>")
  return ctx
}
