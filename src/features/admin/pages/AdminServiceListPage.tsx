import React, { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { getAdminServices, removeAdminService } from "../api"
import type { AdminService } from "../types"
import { Button } from "@/components/ui/button"
import { Search, Layers, Trash2, DollarSign } from "lucide-react"
import { useToast } from "@/shared/ui/use-toast"
import { usePrompt } from "@/shared/ui/use-confirm"
import { UserLink } from "@/shared/components/UserLink"

export const AdminServiceListPage: React.FC = () => {
  const toast = useToast()
  const prompt = usePrompt()
  const [services, setServices] = useState<AdminService[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasLoadedOnce = useRef(false)

  const fetchServicesList = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getAdminServices({ keyword: searchTerm || undefined, page, pageSize })
      setServices(data?.items || [])
      setTotalCount(data?.totalCount || 0)
      hasLoadedOnce.current = true
    } catch (err: any) {
      console.error(err)
      // Ghi chú: Admin gọi Marketplace qua gRPC nhưng Marketplace chưa bật gRPC server ⇒ lỗi ở
      // đây hiện tại là do gap hạ tầng BE, không phải lỗi UI.
      setErrorMsg(
        err.response?.data?.message ||
          "Không tải được danh sách dịch vụ. Có thể do gRPC giữa Admin và Marketplace service chưa được bật ở BE."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServicesList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearchSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setPage(1)
    fetchServicesList()
  }

  const handleRemove = async (id: number) => {
    const reason = await prompt({
      title: "Gỡ gói dịch vụ này?",
      description: "Dịch vụ sẽ bị ẩn khỏi Marketplace. Lý do được lưu lại trong nhật ký kiểm duyệt.",
      label: "Lý do gỡ dịch vụ",
      placeholder: "VD: Mô tả sai lệch so với sản phẩm bàn giao",
      multiline: true,
      confirmText: "Gỡ dịch vụ",
      variant: "destructive",
    })
    if (!reason) return
    try {
      await removeAdminService(id, reason)
      toast.success("Đã gỡ dịch vụ thành công!")
      await fetchServicesList()
    } catch (err: any) {
      console.error(err)
      toast.error("Gỡ dịch vụ thất bại.", err.response?.data?.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Dịch Vụ AI</h1>
        <p className="text-muted-foreground mt-1">Giám sát và gỡ bỏ các gói dịch vụ vi phạm chính sách hệ thống.</p>
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
            placeholder="Tìm kiếm theo tên dịch vụ..."
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

      {(() => {
        if (isLoading && !hasLoadedOnce.current) {
          return (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse h-16 rounded-xl bg-card border" />
              ))}
            </div>
          )
        }
        if (services.length === 0 && !errorMsg) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground">Không tìm thấy dịch vụ nào</h3>
            </div>
          )
        }
        if (services.length > 0) {
          return (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {services.map((s) => (
                  <div key={s.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all">
                    <div className="space-y-1">
                      <Link to={`/marketplace/services/${s.id}`} className="font-bold text-base text-foreground hover:text-primary">
                        {s.title}
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Service ID: #{s.id} • Expert:</span>
                        <UserLink
                          userId={s.expertUserId}
                          showAvatar
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold text-xs"
                        />
                        <span className="flex items-center gap-0.5 font-semibold text-emerald-600">
                          <DollarSign className="h-3 w-3" /> {s.price}
                        </span>
                      </p>
                    </div>

                    <Button
                      onClick={() => handleRemove(s.id)}
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Gỡ dịch vụ
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
          )
        }
        return null
      })()}
    </div>
  )
}
