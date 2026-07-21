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
  /**
   * Chọn theo BẢN CHẤT hành động, không theo mức độ nghiêm trọng:
   *  - `default`     — thao tác thường, hoàn tác được.
   *  - `warning`     — hệ trọng và không hoàn tác được, nhưng KHÔNG mất mát gì:
   *                    phê duyệt đề xuất, nghiệm thu milestone, ra phán quyết, đóng tin.
   *  - `destructive` — thật sự xoá/gỡ/huỷ, người dùng mất thứ đang có.
   *
   * Đừng dùng `destructive` chỉ để "cho nó nghiêm trọng". Trước đây mọi thao tác
   * quan trọng đều gán destructive nên phê duyệt đề xuất — việc tích cực nhất trong
   * cả luồng — cũng hiện đỏ như xoá dữ liệu. Đỏ ở khắp nơi thì đỏ hết ý nghĩa.
   */
  variant?: "default" | "warning" | "destructive"
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
