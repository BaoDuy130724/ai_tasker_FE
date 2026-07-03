import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { getServiceById, getFavorites, addFavorite, removeFavorite } from "../api"
import type { AiService } from "../types"
import { useAuthStore } from "@/features/auth/store"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Star, ArrowLeft, ShieldAlert, ShoppingBag, Sparkles, Heart } from "lucide-react"

export const AiServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [service, setService] = useState<AiService | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  useEffect(() => {
    const fetchServiceDetail = async () => {
      if (!id) return
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const data = await getServiceById(Number(id))
        setService(data)
      } catch (err) {
        console.error(err)
        setErrorMsg("Không tìm thấy thông tin gói dịch vụ AI.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchServiceDetail()
  }, [id])

  useEffect(() => {
    if (!id || !user) return
    getFavorites()
      .then((favs) => setIsFavorited(favs.some((f) => f.serviceId === Number(id))))
      .catch((err) => console.error("Lỗi tải danh sách yêu thích:", err))
  }, [id, user])

  const handleToggleFavorite = async () => {
    if (!id) return
    setIsTogglingFavorite(true)
    try {
      if (isFavorited) {
        await removeFavorite(Number(id))
        setIsFavorited(false)
      } else {
        await addFavorite(Number(id))
        setIsFavorited(true)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || "Thao tác yêu thích thất bại.")
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded-xl" />
        <div className="h-24 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (errorMsg || !service) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Lỗi tải dữ liệu</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Không thể tải chi tiết dịch vụ."}</p>
        <Link to="/marketplace" className="text-primary hover:underline text-sm font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại Marketplace
        </Link>
      </div>
    )
  }

  const isClient = user && user.role === "Client"
  const isOwner = user && service.expertId === Number(user.id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Danh mục ID: #{service.categoryId}</span>
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  {service.rating || "5.0"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{service.title}</h1>
                {user && !isOwner && (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                    className="shrink-0 h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all bg-transparent cursor-pointer disabled:opacity-50"
                    aria-label={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                  >
                    <Heart className={`h-4 w-4 transition-colors ${isFavorited ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-bold text-foreground">Mô tả dịch vụ</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </div>

            {/* Skills */}
            <div className="space-y-2 pt-4">
              <h3 className="font-bold text-foreground">Kỹ năng liên quan</h3>
              <div className="flex flex-wrap gap-1.5">
                {service.skills.map((s) => (
                  <span key={s} className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground border border-border">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3: Purchase Pricing Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-6 sticky top-6">
            <div className="text-center space-y-1 pb-4 border-b">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Đơn giá trọn gói</p>
              <p className="text-3xl font-extrabold text-primary flex items-center justify-center">
                <DollarSign className="h-7 w-7" />
                {service.price} USD
              </p>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Thời gian bàn giao:</span>
                <strong className="text-foreground">{service.deliveryTimeDays} ngày</strong>
              </div>
              <div className="flex justify-between">
                <span>Mã số Expert chủ quản:</span>
                <strong className="text-foreground">#{service.expertId} {isOwner && "(Bạn)"}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-3 border-t">
              {isClient ? (
                <Link to={`/client/orders/new?serviceId=${service.id}`}>
                  <Button className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/95 flex items-center justify-center gap-1.5 shadow-sm">
                    <ShoppingBag className="h-4 w-4" />
                    Đặt mua dịch vụ ngay
                  </Button>
                </Link>
              ) : isOwner ? (
                <Link to={`/expert/services`}>
                  <Button variant="outline" className="w-full border-border hover:bg-secondary font-bold">
                    Quản lý dịch vụ của bạn
                  </Button>
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center">
                  Vui lòng <Link to="/login" className="text-primary underline font-semibold">Đăng nhập với vai trò Client</Link> để đặt mua dịch vụ này.
                </p>
              )}

              {isClient && (
                <Button variant="outline" className="w-full border-border flex items-center justify-center gap-1.5 font-bold" disabled>
                  <Sparkles className="h-4 w-4 text-primary" />
                  Đăng ký gói tháng (Phase sau)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
