import React, { useEffect, useState } from "react"
import { Star, MessageSquare, CornerDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createReview, createReply, getReviewsByProject } from "../api"
import type { Review } from "../types"
import { UserLink } from "@/shared/components/UserLink"
import { useToast } from "@/shared/ui/use-toast"

interface ReviewSectionProps {
  /** Project.id (int) — Review service dùng đúng int này làm projectId (không map Guid). */
  projectId: number
  currentUserId: number
  /** userId của phía đối tác cần đánh giá (Client đánh giá Expert và ngược lại). */
  counterpartId: number
  counterpartLabel: string
}

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readOnly?: boolean }> = ({
  value,
  onChange,
  readOnly,
}) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`bg-transparent border-0 p-0 ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          aria-label={`${star} sao`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  projectId,
  currentUserId,
  counterpartId,
  counterpartLabel,
}) => {
  const toast = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({})
  const [replyingId, setReplyingId] = useState<number | null>(null)

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const data = await getReviewsByProject(projectId)
      setReviews(data)
    } catch (err) {
      console.error("Lỗi tải đánh giá dự án:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const myReview = reviews.find((r) => r.reviewerId === currentUserId)
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) return
    setIsSubmitting(true)
    try {
      await createReview({
        projectId: projectId,
        reviewerId: currentUserId,
        revieweeId: counterpartId,
        rating,
        comment: comment.trim() || null,
      })
      setRating(0)
      setComment("")
      await fetchReviews()
    } catch (err: any) {
      console.error(err)
      toast.error("Gửi đánh giá thất bại.", err.response?.data?.message ?? "Bạn có thể đã đánh giá dự án này rồi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (reviewId: number) => {
    const content = (replyDraft[reviewId] || "").trim()
    if (!content) return
    setIsSubmitting(true)
    try {
      await createReply({ reviewId, replierId: currentUserId, content })
      setReplyDraft((prev) => ({ ...prev, [reviewId]: "" }))
      setReplyingId(null)
      await fetchReviews()
    } catch (err: any) {
      console.error(err)
      toast.error("Gửi phản hồi thất bại.", err.response?.data?.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
      <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
        <Star className="h-5 w-5 text-primary" />
        Đánh giá dự án
      </h3>

      {/* Form đánh giá — chỉ hiện nếu mình chưa đánh giá */}
      {!isLoading && !myReview && (
        <form onSubmit={handleSubmitReview} className="space-y-3 bg-secondary/10 border border-border/50 rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground">Đánh giá {counterpartLabel}</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm hợp tác của bạn..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSubmitting || rating < 1} className="bg-primary text-primary-foreground">
              {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </form>
      )}

      {/* Danh sách review 2 chiều của project */}
      {isLoading ? (
        <div className="h-16 bg-muted rounded-lg animate-pulse" />
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-7 w-7 text-muted-foreground/30 mb-2" />
          <p>Chưa có đánh giá nào cho dự án này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const isForMe = r.revieweeId === currentUserId
            const isMine = r.reviewerId === currentUserId
            return (
              <div key={r.id} className="border border-border rounded-lg p-4 bg-secondary/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    {isMine ? "Bạn" : <UserLink userId={r.reviewerId} className="hover:underline font-semibold" />} đánh giá{" "}
                    {isForMe ? "bạn" : <UserLink userId={r.revieweeId} className="hover:underline font-semibold" />}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                <StarRating value={r.rating} readOnly />
                {r.comment && <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>}

                {r.reply ? (
                  <div className="ml-4 mt-2 pl-3 border-l-2 border-primary/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-primary flex items-center gap-1">
                        <CornerDownRight className="h-3 w-3" /> Phản hồi
                      </p>
                      <span className="text-[10px] text-muted-foreground">{formatDate(r.reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground">{r.reply.content}</p>
                  </div>
                ) : (
                  isForMe && (
                    <div className="pt-1">
                      {replyingId === r.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyDraft[r.id] || ""}
                            onChange={(e) => setReplyDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Viết phản hồi..."
                            className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <Button size="sm" disabled={isSubmitting} onClick={() => handleSubmitReply(r.id)}>
                            Gửi
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingId(r.id)}
                          className="text-xs font-semibold text-primary hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          Trả lời đánh giá này
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
