import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getProfileByUserId } from "@/features/profile/api"
import { User as UserIcon } from "lucide-react"

interface UserLinkProps {
  userId: number
  className?: string
  showAvatar?: boolean
}

interface CachedProfile {
  fullName: string
  avatarUrl: string
  title: string
  role: string
}

// Cache nhẹ trong module: nhiều item trong 1 list (VD: proposal cùng 1 expert, service cùng 1 expert)
// không cần fetch lại hồ sơ đã tải trong cùng phiên trang.
const profileCache = new Map<number, CachedProfile | null>()

// Fetch + cache dùng chung cho UserLink và UserBrief.
const useUserProfile = (userId: number) => {
  const [profile, setProfile] = useState<CachedProfile | null>(profileCache.get(userId) ?? null)
  const [isLoading, setIsLoading] = useState(!profileCache.has(userId))

  useEffect(() => {
    if (profileCache.has(userId)) {
      setProfile(profileCache.get(userId) ?? null)
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    getProfileByUserId(userId)
      .then((p) => {
        // Giữ nguyên fullName thô — phần fallback "Người dùng #N" để lúc render quyết định.
        const entry: CachedProfile | null = p
          ? { fullName: p.fullName, avatarUrl: p.avatarUrl, title: p.title, role: p.role }
          : null
        profileCache.set(userId, entry)
        if (!cancelled) setProfile(entry)
      })
      .catch(() => {
        profileCache.set(userId, null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return { profile, isLoading }
}

const displayName = (profile: CachedProfile | null, userId: number) =>
  profile?.fullName?.trim() || `Người dùng #${userId}`

/**
 * Thay cho việc render thẳng "#123" — resolve userId sang tên thật qua
 * GET /Profiles/{userId} (public, AllowAnonymous) và link sang /profile/{userId}.
 */
export const UserLink: React.FC<UserLinkProps> = ({ userId, className, showAvatar = false }) => {
  const { profile, isLoading } = useUserProfile(userId)

  return (
    <Link
      to={`/profile/${userId}`}
      className={className ?? "inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"}
    >
      {showAvatar &&
        (profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover border border-border" />
        ) : (
          <span className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
            <UserIcon className="h-3 w-3 text-muted-foreground" />
          </span>
        ))}
      {isLoading ? "Đang tải..." : displayName(profile, userId)}
    </Link>
  )
}

interface UserBriefProps {
  userId: number
  /** Hậu tố sau tên, VD "(Bạn)". */
  suffix?: string
  className?: string
}

/**
 * Bản đầy đủ hơn UserLink: avatar lớn + tên + chức danh (title) hoặc vai trò.
 * Dùng ở những chỗ có không gian và cần nhận diện người dùng rõ hơn một dòng chữ,
 * VD khối "Thông tin Hợp đồng".
 *
 * Lưu ý: Profile service KHÔNG trả email qua endpoint công khai GET /Profiles/{userId},
 * nên ở đây chỉ hiển thị được những gì hồ sơ công khai có.
 */
export const UserBrief: React.FC<UserBriefProps> = ({ userId, suffix, className }) => {
  const { profile, isLoading } = useUserProfile(userId)
  // title là chức danh người dùng tự đặt; rỗng thì lùi về role ("Client"/"Expert").
  const subtitle = profile?.title?.trim() || profile?.role?.trim() || ""

  return (
    <div className={className ?? "flex items-center gap-2.5 min-w-0"}>
      {profile?.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt=""
          className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
        />
      ) : (
        <span className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <Link
          to={`/profile/${userId}`}
          className="block truncate text-sm font-semibold text-primary hover:underline"
        >
          {isLoading ? "Đang tải..." : displayName(profile, userId)}
          {suffix && <span className="ml-1 font-normal text-muted-foreground">{suffix}</span>}
        </Link>
        {subtitle && (
          <span className="block truncate text-[11px] font-normal text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
