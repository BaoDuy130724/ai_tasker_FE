import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Nút "Quay lại" an toàn.
 *
 * `navigate(-1)` trần có 2 vấn đề:
 *  - Mở thẳng URL (dán link / tab mới) -> không có history trong app -> back ra khỏi hẳn website.
 *  - Vào trang qua redirect `replace: true` -> entry trước đó đã bị thay, back về chỗ không mong muốn.
 *
 * React Router (BrowserRouter) lưu `idx` trong `window.history.state`.
 * `idx > 0` nghĩa là còn entry để lùi trong phiên hiện tại; ngược lại thì fallback.
 */
export const useSafeBack = (fallback = "/dashboard") => {
  const navigate = useNavigate()

  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === "number" && idx > 0) {
      navigate(-1)
    } else {
      navigate(fallback, { replace: true })
    }
  }, [navigate, fallback])
}
