import React from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import type { Crumb } from "@/app/navigation"

interface BreadcrumbsProps {
  items: Crumb[]
}

/**
 * Đường dẫn phân tầng của trang đang xem.
 *
 * Trên màn hình hẹp chỉ giữ lại mục cuối (trang hiện tại) và mục cha gần nhất; các cấp
 * ở giữa bị `display:none` nên không còn trong cây a11y — chấp nhận được vì ở khổ này
 * người dùng vẫn có menu điều hướng đầy đủ trong sheet bên trái.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <nav aria-label="Đường dẫn trang" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isParent = index === items.length - 2
          // Ẩn các cấp giữa trên mobile để header không bị tràn.
          const responsive = isLast || isParent ? "flex" : "hidden lg:flex"

          return (
            <li key={`${item.to ?? "current"}-${index}`} className={`${responsive} items-center gap-1 min-w-0`}>
              {isLast ? (
                <span
                  aria-current="page"
                  className="truncate font-semibold text-foreground max-w-[10rem] sm:max-w-xs md:max-w-md"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to!}
                  className="flex items-center gap-1.5 truncate rounded px-1 py-0.5 text-muted-foreground transition-colors hover:text-foreground max-w-[8rem] sm:max-w-[12rem]"
                  title={item.label}
                >
                  {index === 0 && <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
              {/* Dấu phân cách gắn vào mục ĐỨNG TRƯỚC, không phải mục đứng sau: khi các cấp
                  giữa bị ẩn trên mobile, dấu phân cách của chúng ẩn theo, không để lại ">" mồ côi. */}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
