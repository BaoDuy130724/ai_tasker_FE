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
}

// Cache nhẹ trong module: nhiều item trong 1 list (VD: proposal cùng 1 expert, service cùng 1 expert)
// không cần fetch lại hồ sơ đã tải trong cùng phiên trang.
const profileCache = new Map<number, CachedProfile | null>()

/**
 * Thay cho việc render thẳng "#123" — resolve userId sang tên thật qua
 * GET /Profiles/{userId} (public, AllowAnonymous) và link sang /profile/{userId}.
 */
export const UserLink: React.FC<UserLinkProps> = ({ userId, className, showAvatar = false }) => {
  const cached = profileCache.get(userId)
  const [profile, setProfile] = useState<CachedProfile | null>(cached ?? null)
  const [isLoading, setIsLoading] = useState(!profileCache.has(userId))

  useEffect(() => {
    if (profileCache.has(userId)) {
      setProfile(profileCache.get(userId) ?? null)
      setIsLoading(false)
      return
    }
    let cancelled = false
    getProfileByUserId(userId)
      .then((p) => {
        const entry: CachedProfile | null = p
          ? { fullName: p.fullName || `Người dùng #${userId}`, avatarUrl: p.avatarUrl }
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
      {isLoading ? "Đang tải..." : profile?.fullName || `Người dùng #${userId}`}
    </Link>
  )
}
