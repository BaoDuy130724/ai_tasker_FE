import React, { useEffect, useState } from "react"
import { Star, MessageSquare } from "lucide-react"
import { getAverageRating, getReviewsByUser } from "../api"
import type { AverageRating, Review } from "../types"
import { UserLink } from "@/shared/components/UserLink"

interface UserRatingSummaryProps {
  userId: number
}

const StarRow: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
)

/**
 * Dùng nguồn thật từ Review service (GET /reviews/user/{id}, GET /reviews/user/{id}/rating)
 * thay vì AiService.averageRating/totalReviews (số denormalize riêng của Marketplace, có thể lệch).
 */
export const UserRatingSummary: React.FC<UserRatingSummaryProps> = ({ userId }) => {
  const [summary, setSummary] = useState<AverageRating | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([getAverageRating(userId), getReviewsByUser(userId)])
      .then(([rating, reviewList]) => {
        setSummary(rating || { userId, averageRating: 0, totalReviews: 0 })
        setReviews(reviewList)
      })
      .catch((err) => console.error("Lỗi tải đánh giá:", err))
      .finally(() => setIsLoading(false))
  }, [userId])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

  if (isLoading) {
    return <div className="h-24 bg-muted rounded-xl animate-pulse" />
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-bold text-base flex items-center gap-1.5">
          <Star className="h-5 w-5 text-primary" />
          Đánh giá & Uy tín
        </h3>
        <div className="flex items-center gap-2">
          <StarRow value={summary?.averageRating || 0} />
          <span className="text-sm font-bold text-foreground">{(summary?.averageRating || 0).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({summary?.totalReviews || 0} đánh giá)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-7 w-7 text-muted-foreground/30 mb-2" />
          <p>Chưa có đánh giá nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-3 bg-secondary/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <UserLink userId={r.reviewerId} className="hover:underline font-semibold" /> đã đánh giá
                </span>
                <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
              </div>
              <StarRow value={r.rating} />
              {r.comment && <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>}
              {r.reply && (
                <div className="ml-3 mt-1 pl-3 border-l-2 border-primary/30">
                  <p className="text-xs font-semibold text-primary">Phản hồi</p>
                  <p className="text-sm text-foreground">{r.reply.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
