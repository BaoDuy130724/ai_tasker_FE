import { createContext, useContext } from "react"

/**
 * Context + hook của Toast, tách khỏi `toast.tsx`.
 *
 * File component chỉ được export component thì Fast Refresh của Vite mới hoạt động;
 * để lẫn hook/constant vào đó sẽ khiến mọi lần sửa file làm mất state toàn cây con.
 */
export type ToastVariant = "success" | "error" | "info"

export interface ToastApi {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast phải nằm trong <ToastProvider>")
  return ctx
}
