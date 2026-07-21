import { createContext, useContext } from "react"

/**
 * Context + hook của Confirm/Prompt dialog, tách khỏi `confirm-dialog.tsx`.
 *
 * File component chỉ được export component thì Fast Refresh của Vite mới hoạt động;
 * để lẫn hook vào đó sẽ khiến mọi lần sửa file làm mất state toàn cây con.
 */
export interface ConfirmOptions {
  title: string
  description?: string
  /** Nhãn nút xác nhận. Nên là ĐỘNG TỪ của hành động ("Phê duyệt", "Gỡ"), không phải "OK". */
  confirmText?: string
  cancelText?: string
  /** `destructive` cho hành động mất mát/không hoàn tác được. */
  variant?: "default" | "destructive"
}

/** Cấu hình ô nhập, dùng cho luồng thay thế `window.prompt`. */
export interface PromptOptions extends ConfirmOptions {
  label: string
  placeholder?: string
  /** Mặc định bắt buộc — prompt không có nội dung thì hành động cũng vô nghĩa. */
  required?: boolean
  multiline?: boolean
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>
/** Trả về chuỗi đã nhập, hoặc `null` nếu người dùng huỷ. */
export type PromptFn = (options: PromptOptions) => Promise<string | null>

export interface DialogApi {
  confirm: ConfirmFn
  prompt: PromptFn
}

export const DialogContext = createContext<DialogApi | null>(null)

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("useConfirm phải nằm trong <ConfirmProvider>")
  return ctx.confirm
}

export const usePrompt = (): PromptFn => {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("usePrompt phải nằm trong <ConfirmProvider>")
  return ctx.prompt
}
