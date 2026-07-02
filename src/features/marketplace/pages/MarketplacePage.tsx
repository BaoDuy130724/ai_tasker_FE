import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getServices, getCategories } from "../api"
import type { AiService, Category } from "../types"
import { Button } from "@/components/ui/button"
import { Search, DollarSign, Clock, Star, Layers, SlidersHorizontal, ArrowUpDown } from "lucide-react"

export const MarketplacePage: React.FC = () => {
  const [services, setServices] = useState<AiService[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState("createdAt")
  const [isDescending, setIsDescending] = useState(true)
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize] = useState(6)

  const fetchCategoriesList = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error("Lỗi fetch categories:", err)
    }
  }

  const fetchServicesList = async () => {
    setIsLoading(true)
    try {
      const data = await getServices({
        searchTerm: searchTerm || undefined,
        categoryId: selectedCategory,
        minPrice,
        maxPrice,
        sortBy,
        isDescending,
        pageIndex,
        pageSize,
      })
      if (data) {
        setServices(data.items || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error("Lỗi fetch services list:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoriesList()
  }, [])

  useEffect(() => {
    fetchServicesList()
  }, [pageIndex, sortBy, isDescending, selectedCategory])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPageIndex(1)
    fetchServicesList()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Marketplace Dịch Vụ AI</h1>
        <p className="text-muted-foreground mt-1">Tìm kiếm và mua các gói giải pháp AI tích hợp sẵn từ các Expert hàng đầu.</p>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập từ khóa tìm gói dịch vụ (VD: Chatbot, Gemini)..."
            />
          </div>
          
          <Button type="submit" className="bg-primary text-primary-foreground font-semibold px-6 hover:bg-primary/90 transition-all">
            Tìm kiếm
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Lọc Category */}
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Layers className="h-4 w-4" />
              Danh mục:
            </span>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Lọc Giá */}
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Giá từ ($):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice || ""}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min"
                className="w-20 rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                value={maxPrice || ""}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max"
                className="w-20 rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <ArrowUpDown className="h-4 w-4" />
              Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="createdAt">Mới nhất</option>
              <option value="price">Giá bán</option>
            </select>
            <button
              type="button"
              onClick={() => setIsDescending(!isDescending)}
              className="p-1.5 rounded-lg border border-input hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              {isDescending ? "↓" : "↑"}
            </button>
          </div>
        </div>
      </form>

      {/* Services List Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-5 w-2/3 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-xl">
          <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy gói dịch vụ nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác để tìm thêm giải pháp.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all">
                {/* Cover Image */}
                <div className="h-40 bg-secondary/50 relative flex items-center justify-center text-muted-foreground">
                  {service.coverImageUrl ? (
                    <img src={service.coverImageUrl} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="h-12 w-12 text-muted-foreground/30" />
                  )}
                  <span className="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded-xl bg-emerald-500 text-white px-3 py-1 text-xs font-extrabold shadow">
                    <DollarSign className="h-3.5 w-3.5" />
                    {service.price}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Expert ID: #{service.expertId}</span>
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        {service.rating || "5.0"}
                      </span>
                    </div>

                    <Link to={`/marketplace/services/${service.id}`} className="font-extrabold text-base text-foreground hover:text-primary transition-all line-clamp-1">
                      {service.title}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <div className="flex flex-wrap gap-1">
                      {service.skills?.slice(0, 3).map((s) => (
                        <span key={s} className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[9px] font-semibold text-foreground border border-border">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Giao hàng: {service.deliveryTimeDays} ngày
                      </span>
                      <Link to={`/marketplace/services/${service.id}`}>
                        <Button size="sm" variant="outline" className="text-xs font-semibold h-7 border-border hover:bg-secondary">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex === 1}
                onClick={() => setPageIndex(pageIndex - 1)}
                className="border-border hover:bg-secondary"
              >
                Trước
              </Button>
              <span className="text-sm font-semibold text-muted-foreground">
                Trang {pageIndex} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex === totalPages}
                onClick={() => setPageIndex(pageIndex + 1)}
                className="border-border hover:bg-secondary"
              >
                Tiếp
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
