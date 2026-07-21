import React from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Đổi giá trị này (VD: pathname) để tự reset boundary khi điều hướng sang trang khác. */
  resetKey?: string
  /** Nhãn hiển thị để biết boundary nào bắt lỗi. */
  scope?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Chặn lỗi render của cây con, tránh việc cả app unmount thành trang trắng.
 * Bắt buộc là class component — React chưa có hook tương đương componentDidCatch.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.scope ? ` · ${this.props.scope}` : ""}]`, error, info.componentStack)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Điều hướng sang route khác thì bỏ trạng thái lỗi cũ đi.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  private handleRetry = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-xl bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-xl font-bold">Đã xảy ra lỗi khi hiển thị trang</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Giao diện gặp sự cố ngoài dự kiến. Bạn có thể thử lại hoặc tải lại trang.
        </p>

        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-48 max-w-full overflow-auto rounded-lg border border-border bg-secondary/50 p-4 text-left text-xs whitespace-pre-wrap">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={this.handleRetry} className="flex items-center gap-1.5">
            <RotateCw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
      </div>
    )
  }
}
