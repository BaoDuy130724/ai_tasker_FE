import React, { useCallback, useEffect, useState } from "react"
import { ChevronDown, ChevronRight, ExternalLink, Paperclip } from "lucide-react"
import { getDeliverablesByMilestone } from "../api"
import type { Deliverable } from "../types"

interface MilestoneDeliverablesProps {
  milestoneId: number
  /** Mở sẵn cho milestone đang chờ duyệt — Client cần thấy ngay thứ mình sắp giải ngân. */
  defaultOpen?: boolean
  /** Đổi giá trị để buộc tải lại (VD: sau khi Expert vừa nộp bài mới). */
  refreshKey?: number
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString("vi-VN")
}

/**
 * Danh sách các lần Expert nộp bài của một milestone.
 *
 * Tải lười (chỉ fetch khi mở) để một project nhiều milestone không bắn hàng loạt
 * request lúc vào trang. Lỗi được hiển thị tường minh thay vì nuốt im lặng —
 * "không có bài nộp" và "gọi API hỏng" là hai chuyện khác nhau.
 */
export const MilestoneDeliverables: React.FC<MilestoneDeliverablesProps> = ({
  milestoneId,
  defaultOpen = false,
  refreshKey = 0,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [items, setItems] = useState<Deliverable[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setItems(await getDeliverablesByMilestone(milestoneId))
    } catch (e) {
      console.error(`Lỗi tải deliverable của milestone ${milestoneId}:`, e)
      setError("Không tải được danh sách bài nộp.")
    } finally {
      setIsLoading(false)
    }
  }, [milestoneId])

  // Tải khi mở lần đầu, và tải lại khi refreshKey đổi lúc đang mở.
  useEffect(() => {
    if (isOpen) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, refreshKey])

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Paperclip className="h-3 w-3" />
        Bài Expert đã nộp
        {items !== null && <span className="font-normal text-muted-foreground">({items.length})</span>}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {isLoading && <p className="text-[11px] text-muted-foreground">Đang tải...</p>}

          {error && (
            <p className="text-[11px] text-destructive">
              {error}{" "}
              <button type="button" onClick={load} className="underline font-semibold">
                Thử lại
              </button>
            </p>
          )}

          {!isLoading && !error && items?.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Expert chưa nộp bài nào cho mốc này.</p>
          )}

          {!isLoading &&
            !error &&
            items?.map((d, index) => (
              <div key={d.id} className="rounded-md border border-border bg-background p-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {index === 0 ? "Lần nộp mới nhất" : `Lần nộp #${items.length - index}`}
                    {" • "}
                    {formatDateTime(d.submittedAt)}
                  </span>
                </div>

                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline break-all"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {d.fileUrl}
                </a>

                {d.note?.trim() && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {d.note}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
