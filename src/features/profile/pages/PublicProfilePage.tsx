import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { User as UserIcon, Award, Briefcase, Tag, ArrowLeft } from "lucide-react"
import { getProfileByUserId } from "../api"
import type { UserProfile } from "../types"
import { UserRatingSummary } from "@/features/reviews/components/UserRatingSummary"
import { useSafeBack } from "@/shared/hooks/useSafeBack"

const certificateStatusStyle = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "Rejected":
      return "bg-destructive/10 text-destructive border-destructive/20"
    default:
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
  }
}

/** Hồ sơ công khai, chỉ đọc — GET /Profiles/{userId} (BE AllowAnonymous). */
export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const goBack = useSafeBack()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return
    setIsLoading(true)
    setNotFound(false)
    getProfileByUserId(Number(userId))
      .then((data) => {
        if (data) setProfile(data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [userId])

  // Chỉ hiện chứng chỉ đã được Admin duyệt — hồ sơ công khai không nên lộ hồ sơ Pending/Rejected của người khác.
  const approvedCertificates = profile?.certificates.filter((c) => c.status === "Approved") || []

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-32 w-full bg-muted rounded-xl" />
        <div className="h-40 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl">
        <UserIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-lg font-bold text-foreground">Không tìm thấy hồ sơ</h3>
        <p className="text-sm text-muted-foreground mt-1">Người dùng này chưa có hồ sơ hoặc không tồn tại.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại
      </button>

      {/* Avatar + Thông tin cơ bản */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center border border-border">
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-bold text-lg text-foreground">{profile.fullName || `Người dùng #${profile.userId}`}</p>
            <p className="text-sm text-muted-foreground">{profile.title || "Chưa có chức danh"}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
              {profile.role}
            </span>
          </div>
        </div>
        {profile.bio && <p className="text-sm text-muted-foreground mt-4 border-t border-border pt-4 leading-relaxed">{profile.bio}</p>}
      </div>

      {/* Đánh giá & Uy tín (nguồn thật từ Review service) */}
      <UserRatingSummary userId={profile.userId} />

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
          <Tag className="h-5 w-5 text-primary" />
          Kỹ năng
        </h3>
        {profile.skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có kỹ năng nào.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s.id} className="text-xs font-semibold bg-secondary/40 border border-border rounded-full px-3 py-1">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
          <Briefcase className="h-5 w-5 text-primary" />
          Portfolio
        </h3>
        {profile.portfolioItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dự án nào trong portfolio.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.portfolioItems.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 bg-secondary/10 space-y-1.5">
                <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block">
                    Xem dự án →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates (chỉ hiện đã duyệt) */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
          <Award className="h-5 w-5 text-primary" />
          Chứng chỉ
        </h3>
        {approvedCertificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có chứng chỉ nào được xác thực.</p>
        ) : (
          <div className="space-y-2">
            {approvedCertificates.map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-border rounded-lg p-3 bg-secondary/10">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.issuedBy} • {new Date(c.issueDate).toLocaleDateString("vi-VN")}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase border rounded px-2 py-0.5 ${certificateStatusStyle(c.status)}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
