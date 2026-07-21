import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getFavorites, removeFavorite } from "../api"
import type { Favorite } from "../types"
import { Heart, DollarSign, Clock, Star, Layers } from "lucide-react"
import { UserLink } from "@/shared/components/UserLink"
import { useToast } from "@/shared/ui/use-toast"

export const FavoritesPage: React.FC = () => {
  const toast = useToast()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      const data = await getFavorites()
      setFavorites(data)
    } catch (err) {
      console.error("Lỗi tải danh sách yêu thích:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  const handleRemove = async (serviceId: number) => {
    try {
      await removeFavorite(serviceId)
      setFavorites((prev) => prev.filter((f) => f.serviceId !== serviceId))
    } catch (err: any) {
      console.error(err)
      toast.error("Bỏ yêu thích thất bại.", err.response?.data?.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dịch vụ đã lưu</h1>
        <p className="text-muted-foreground mt-1">Các gói dịch vụ AI bạn đã đánh dấu yêu thích để xem lại sau.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 h-56" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-xl">
          <Heart className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Chưa có dịch vụ yêu thích nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
            Nhấn biểu tượng trái tim ở trang chi tiết dịch vụ để lưu lại xem sau.
          </p>
          <Link to="/marketplace" className="mt-4 text-primary hover:underline text-sm font-semibold">
            Khám phá Marketplace →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <div key={fav.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all">
              <div className="h-32 bg-secondary/50 relative flex items-center justify-center text-muted-foreground">
                {fav.service.coverImageUrl ? (
                  <img src={fav.service.coverImageUrl} alt={fav.service.title} className="w-full h-full object-cover" />
                ) : (
                  <Layers className="h-10 w-10 text-muted-foreground/30" />
                )}
                <button
                  onClick={() => handleRemove(fav.serviceId)}
                  className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-secondary transition-all cursor-pointer"
                  aria-label="Bỏ yêu thích"
                >
                  <Heart className="h-4 w-4 fill-destructive text-destructive" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <UserLink userId={fav.service.expertId} className="hover:underline font-semibold" />
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    {fav.service.averageRating || "5.0"}
                    <span className="text-muted-foreground font-normal">({fav.service.totalReviews || 0})</span>
                  </span>
                </div>
                <Link to={`/marketplace/services/${fav.serviceId}`} className="font-extrabold text-sm text-foreground hover:text-primary transition-all line-clamp-1 block">
                  {fav.service.title}
                </Link>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/60">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {fav.service.deliveryTimeDays} ngày
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-emerald-600">
                    <DollarSign className="h-3.5 w-3.5" /> {fav.service.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
