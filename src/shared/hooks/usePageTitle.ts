import { createContext, useContext, useEffect } from "react"

export interface PageTitleContextValue {
  /** Tên thật của trang hiện tại, hoặc null nếu trang chưa cung cấp. */
  title: string | null
  setTitle: (title: string | null) => void
}

export const PageTitleContext = createContext<PageTitleContextValue>({
  title: null,
  setTitle: () => {},
})

/** Nhãn động của trang đang mở — dùng bởi breadcrumb trong AppShell. */
export const usePageTitleValue = () => useContext(PageTitleContext).title

/**
 * Đặt nhãn breadcrumb (và title của tab trình duyệt) cho trang hiện tại.
 *
 * Gọi với `undefined`/`null` khi dữ liệu chưa về — breadcrumb tự lùi về nhãn tĩnh
 * của route, không hiện "undefined".
 *
 * ```tsx
 * usePageTitle(job?.title)
 * ```
 */
export const usePageTitle = (title?: string | null) => {
  const { setTitle } = useContext(PageTitleContext)
  const normalized = title?.trim() || null

  useEffect(() => {
    setTitle(normalized)
  }, [normalized, setTitle])
}
