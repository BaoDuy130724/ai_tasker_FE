import React, { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { getJobs } from "../api"
import type { PagedResult } from "../api"
import type { Job } from "../types"
import { JobStatus } from "../types"
import { Button } from "@/components/ui/button"
import { Search, DollarSign, Calendar, SlidersHorizontal, ArrowUpDown } from "lucide-react"

export const JobListPage: React.FC = () => {
  const [jobsData, setJobsData] = useState<PagedResult<Job> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Filter đang GÕ — chỉ là nội dung ô input, không tự kích hoạt gọi API.
  const [skillFilter, setSkillFilter] = useState("")
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined)
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined)

  // Filter ĐÃ ÁP DỤNG — chỉ đổi khi bấm "Tìm kiếm", và đây mới là thứ effect phụ thuộc.
  // Tách 2 nhóm để dependency của useEffect khai báo đúng sự thật mà hành vi vẫn là
  // "lọc theo submit". Trước đây gộp làm một nên phải cố ý bỏ dep -> lint cảnh báo.
  const [appliedFilters, setAppliedFilters] = useState<{
    skill: string
    minBudget?: number
    maxBudget?: number
  }>({ skill: "", minBudget: undefined, maxBudget: undefined })

  const [sortBy, setSortBy] = useState("createdAt")
  const [descending, setDescending] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(6)

  const fetchJobsList = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getJobs({
        skill: appliedFilters.skill || undefined,
        minBudget: appliedFilters.minBudget,
        maxBudget: appliedFilters.maxBudget,
        status: JobStatus.Open, // Chỉ lấy Job đang mở ứng tuyển
        sortBy,
        descending,
        page,
        pageSize,
      })
      setJobsData(data)
    } catch (error) {
      console.error("Lỗi fetch jobs list:", error)
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters, sortBy, descending, page, pageSize])

  useEffect(() => {
    fetchJobsList()
  }, [fetchJobsList])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Chỉ set state; effect tự chạy lại. Bản cũ gọi thẳng fetchJobsList() ngay sau setPage(1)
    // nên request vẫn mang `page` CŨ (setState bất đồng bộ) — tìm kiếm từ trang 2 trở đi bị sai trang.
    setPage(1)
    setAppliedFilters({ skill: skillFilter, minBudget, maxBudget })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Tìm kiếm công việc Freelance</h1>
        <p className="text-muted-foreground mt-1">Khám phá hàng ngàn công việc chất lượng cao từ các nhà tuyển dụng hàng đầu.</p>
      </div>

      {/* Lọc & Tìm kiếm */}
      <form onSubmit={handleSearchSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Lọc theo kỹ năng */}
          <div className="flex-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập kỹ năng cần tìm (VD: React, Python)..."
            />
          </div>
          
          <Button type="submit" className="bg-primary text-primary-foreground font-semibold px-6 hover:bg-primary/90 transition-all">
            Tìm kiếm
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Lọc ngân sách ($):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minBudget || ""}
                onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min"
                className="w-20 rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                value={maxBudget || ""}
                onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max"
                className="w-20 rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none"
              />
            </div>
          </div>

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
              <option value="budget">Ngân sách</option>
              <option value="deadline">Hạn chót</option>
            </select>
            <button
              type="button"
              onClick={() => setDescending(!descending)}
              className="p-1.5 rounded-lg border border-input hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              {descending ? "↓" : "↑"}
            </button>
          </div>
        </div>
      </form>

      {/* Danh sách Jobs */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {[1, 2, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 rounded bg-muted" />
                <div className="h-6 w-16 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : !jobsData || jobsData.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-xl">
          <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy công việc nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
            Thử thay đổi kỹ năng tìm kiếm hoặc bộ lọc ngân sách để tìm được nhiều kết quả hơn.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {jobsData.items.map((job) => (
              <div key={job.id} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/jobs/${job.id}`} className="font-bold text-lg text-foreground hover:text-primary transition-all line-clamp-1">
                      {job.title}
                    </Link>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-semibold border border-emerald-500/20 whitespace-nowrap">
                      <DollarSign className="h-3 w-3" />
                      {job.budget}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {job.skills.map((s) => (
                      <span key={s} className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground border border-border">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 mt-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Hạn: {formatDate(job.deadline)}
                  </span>
                  <span>Đăng: {formatDate(job.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {jobsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="border-border hover:bg-secondary transition-all"
              >
                Trước
              </Button>
              <span className="text-sm font-semibold text-muted-foreground">
                Trang {page} / {jobsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === jobsData.totalPages}
                onClick={() => setPage(page + 1)}
                className="border-border hover:bg-secondary transition-all"
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
