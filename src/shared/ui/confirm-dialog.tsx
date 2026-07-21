import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, HelpCircle, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"

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

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>
/** Trả về chuỗi đã nhập, hoặc `null` nếu người dùng huỷ. */
type PromptFn = (options: PromptOptions) => Promise<string | null>

interface DialogApi {
  confirm: ConfirmFn
  prompt: PromptFn
}

const DialogContext = createContext<DialogApi | null>(null)

interface PendingState extends ConfirmOptions {
  input?: Omit<PromptOptions, keyof ConfirmOptions>
  resolve: (value: boolean | string | null) => void
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingState | null>(null)
  const [value, setValue] = useState("")
  const dialogRef = useRef<HTMLDialogElement>(null)

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setValue("")
        setPending({ ...options, resolve: resolve as PendingState["resolve"] })
      }),
    []
  )

  const prompt = useCallback<PromptFn>(
    ({ label, placeholder, required = true, multiline, ...rest }) =>
      new Promise<string | null>((resolve) => {
        setValue("")
        setPending({
          ...rest,
          input: { label, placeholder, required, multiline },
          resolve: resolve as PendingState["resolve"],
        })
      }),
    []
  )

  const api = useMemo<DialogApi>(() => ({ confirm, prompt }), [confirm, prompt])

  // showModal() phải gọi SAU khi <dialog> đã nằm trong DOM.
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (pending && !el.open) el.showModal()
  }, [pending])

  const settle = useCallback((accepted: boolean, text: string) => {
    setPending((current) => {
      if (current) {
        // prompt -> string|null; confirm -> boolean.
        // Huỷ luôn là giá trị "không", không bao giờ mặc định đồng ý.
        if (!current.input) current.resolve(accepted)
        else current.resolve(accepted ? text : null)
      }
      return null
    })
    dialogRef.current?.close()
  }, [])

  const isDestructive = pending?.variant === "destructive"
  const input = pending?.input
  let Icon = HelpCircle
  if (input) Icon = PenLine
  else if (isDestructive) Icon = AlertTriangle
  const isConfirmDisabled = Boolean(input?.required) && value.trim().length === 0

  const accentWrap = isDestructive
    ? "bg-destructive/10 text-destructive dark:text-red-400"
    : "bg-primary/10 text-primary"

  const fieldClass =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"

  return (
    <DialogContext.Provider value={api}>
      {children}

      {pending && (
        <dialog
          ref={dialogRef}
          onCancel={(e) => {
            e.preventDefault()
            settle(false, "")
          }}
          onClick={(e) => {
            if (e.target === dialogRef.current) settle(false, "")
          }}
          aria-labelledby="confirm-title"
          aria-describedby={pending.description ? "confirm-desc" : undefined}
          className="w-full animate-in fade-in zoom-in-95 duration-150 ease-out"
        >
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault()
              if (!isConfirmDisabled) settle(true, value)
            }}
            className="rounded-xl border border-border bg-elevated p-6 text-left shadow-xl"
          >
            <div className="flex items-start gap-4">
              <span className={`shrink-0 rounded-xl p-2.5 ${accentWrap}`}>
                <Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1 space-y-1.5">
                <h2 id="confirm-title" className="text-lg font-bold leading-snug text-elevated-foreground">
                  {pending.title}
                </h2>
                {pending.description && (
                  <p id="confirm-desc" className="text-sm leading-relaxed text-muted-foreground">
                    {pending.description}
                  </p>
                )}
              </div>
            </div>

            {input && (
              <div className="mt-5 space-y-1.5">
                <label htmlFor="confirm-input" className="block text-sm font-semibold text-elevated-foreground">
                  {input.label}
                </label>
                {input.multiline ? (
                  <textarea
                    id="confirm-input"
                    rows={3}
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={input.placeholder}
                    className={`${fieldClass} leading-relaxed resize-y`}
                  />
                ) : (
                  <input
                    id="confirm-input"
                    type="text"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={input.placeholder}
                    className={fieldClass}
                  />
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => settle(false, "")}
                // Hành động phá huỷ thì focus mặc định nằm ở nút an toàn: Enter vội không xoá nhầm.
                // Có ô nhập thì focus thuộc về ô nhập nên bỏ qua.
                autoFocus={isDestructive && !input}
                // bg-transparent thay vì bg-background của variant outline: ở dark theme bg-background
                // tối hơn hẳn mặt dialog nên trông như một cái "lỗ" thủng trên panel.
                className="border-border bg-transparent font-semibold text-elevated-foreground hover:bg-secondary"
              >
                {pending.cancelText ?? "Huỷ"}
              </Button>
              <Button
                type="submit"
                disabled={isConfirmDisabled}
                autoFocus={!isDestructive && !input}
                className={
                  isDestructive
                    ? "bg-destructive font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90"
                    : "bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                }
              >
                {pending.confirmText ?? "Xác nhận"}
              </Button>
            </div>
          </form>
        </dialog>
      )}
    </DialogContext.Provider>
  )
}

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
