import React, { useCallback, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { PageTitleContext } from "@/shared/hooks/usePageTitle"

/**
 * Giữ nhãn động của trang đang mở để breadcrumb hiện "Xây dựng chatbot CSKH"
 * thay vì "Chi tiết công việc".
 *
 * Tiêu đề được lưu KÈM pathname và bị coi là hết hạn ngay khi đổi URL, thay vì reset
 * bằng effect: effect của trang con chạy TRƯỚC effect của provider, nên reset kiểu đó
 * sẽ xoá đúng cái tiêu đề mà trang mới vừa đặt.
 */
export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()
  const [entry, setEntry] = useState<{ path: string; title: string | null }>({
    path: pathname,
    title: null,
  })

  // Trang gọi setTitle trong effect -> cần pathname tại thời điểm gọi, không phải lúc tạo callback.
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const setTitle = useCallback((title: string | null) => {
    setEntry((prev) => {
      const next = { path: pathnameRef.current, title }
      if (prev.path === next.path && prev.title === next.title) return prev
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ title: entry.path === pathname ? entry.title : null, setTitle }),
    [entry, pathname, setTitle]
  )

  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>
}
