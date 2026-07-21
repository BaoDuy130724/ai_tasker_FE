import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAdminJobs, removeAdminJob } from "../api"
import type { AdminJob } from "../types"
import { Button } from "@/components/ui/button"
import { Search, Briefcase, Trash2 } from "lucide-react"
import { useToast } from "@/shared/ui/use-toast"
import { usePrompt } from "@/shared/ui/use-confirm"
import { UserLink } from "@/shared/components/UserLink"

export const AdminJobListPage: React.FC = () => {
  const toast = useToast()
  const prompt = usePrompt()
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const fetchJobsList = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getAdminJobs({ keyword: searchTerm || undefined, page, pageSize })
      setJobs(data?.items || [])
      setTotalCount(data?.totalCount || 0)
    } catch (err: any) {
      console.error(err)
      // Ghi chú: hiện tại Admin gọi Job qua gRPC nhưng Job service chưa bật gRPC server ⇒ lỗi
      // network/500 ở bước này là do gap hạ tầng BE, không phải lỗi UI.
      setErrorMsg(
        err.response?.data?.message ||
          "Không tải được danh sách Job. Có thể do gRPC giữa Admin và Job service chưa được bật ở BE."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobsList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobsList()
  }

  const handleRemove = async (id: number) => {
    const reason = await prompt({
      title: "Gỡ tin tuyển dụng này?",
      description: "Tin sẽ bị ẩn khỏi hệ thống. Lý do được lưu lại trong nhật ký kiểm duyệt.",
      label: "Lý do gỡ tin",
      placeholder: "VD: Nội dung vi phạm chính sách nền tảng",
      multiline: true,
      confirmText: "Gỡ tin",
      variant: "destructive",
    })
    if (!reason) return
    try {
      await removeAdminJob(id, reason)
      toast.success("Đã gỡ tin tuyển dụng thành công!")
      await fetchJobsList()
    } catch (err: any) {
      console.error(err)
      toast.error("Gỡ tin tuyển dụng thất bại.", err.response?.data?.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Job</h1>
        <p className="text-muted-foreground mt-1">Giám sát và gỡ bỏ các tin tuyển dụng vi phạm chính sách hệ thống.</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm flex gap-3">
        <div className="flex-1 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none"
            placeholder="Tìm kiếm theo tiêu đề Job..."
          />
        </div>
        <Button type="submit" className="bg-primary text-primary-foreground font-semibold px-6">
          Tìm kiếm
        </Button>
      </form>

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-card border" />
          ))}
        </div>
      ) : jobs.length === 0 && !errorMsg ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy Job nào</h3>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {jobs.map((j) => (
              <div key={j.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/jobs/${j.id}`} className="font-bold text-base text-foreground hover:text-primary">
                      {j.title}
                    </Link>
                    <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground border border-border">
                      {j.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>Job ID: #{j.id} • Chủ sở hữu:</span>
                    <UserLink
                      userId={j.ownerUserId}
                      showAvatar
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold text-xs"
                    />
                  </p>
                </div>

                <Button
                  onClick={() => handleRemove(j.id)}
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Gỡ tin
                </Button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</Button>
              <span className="text-sm font-semibold text-muted-foreground">Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Tiếp</Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
