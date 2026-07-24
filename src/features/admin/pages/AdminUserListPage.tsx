import React, { useEffect, useState, useCallback, useRef } from "react"
import { getUsers, lockUser } from "../api"
import type { AdminUser } from "../types"
import { Button } from "@/components/ui/button"
import { Search, ShieldAlert, Lock, Unlock } from "lucide-react"
import { useToast } from "@/shared/ui/use-toast"
import { useConfirm } from "@/shared/ui/use-confirm"
import { useAuthStore } from "@/features/auth/store"

export const AdminUserListPage: React.FC = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const { user: currentUser } = useAuthStore()
  const myId = currentUser ? Number(currentUser.id) : 0
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Ô tìm kiếm đang GÕ — không tự gọi API.
  const [searchTerm, setSearchTerm] = useState("")
  // Từ khoá ĐÃ ÁP DỤNG — chỉ đổi khi submit; đây mới là thứ effect phụ thuộc.
  const [appliedKeyword, setAppliedKeyword] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  const hasLoadedOnce = useRef(false)

  const fetchUsersList = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getUsers({
        keyword: appliedKeyword || undefined,
        role: selectedRole || undefined,
        page,
        pageSize,
      })
      if (data) {
        setUsers(data.items || [])
        setTotalPages(data.totalPages || 1)
        hasLoadedOnce.current = true
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [appliedKeyword, selectedRole, page, pageSize])

  useEffect(() => {
    fetchUsersList()
  }, [fetchUsersList])

  const handleSearchSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    // Chỉ set state; effect tự chạy lại. Bản cũ gọi thẳng fetchUsersList() ngay sau setPage(1)
    // nên request vẫn mang `page` CŨ (setState bất đồng bộ).
    setPage(1)
    setAppliedKeyword(searchTerm)
  }

  const handleToggleLock = async (id: number, currentLockStatus: boolean) => {
    const actionText = currentLockStatus ? "Mở khóa" : "Khóa"
    const ok = await confirm({
      title: `${actionText} tài khoản này?`,
      description: currentLockStatus
        ? "Người dùng sẽ đăng nhập và sử dụng hệ thống trở lại được."
        : "Người dùng sẽ bị chặn đăng nhập cho tới khi được mở khóa lại.",
      confirmText: actionText,
      variant: currentLockStatus ? "default" : "destructive",
    })
    if (!ok) return

    try {
      await lockUser(id, !currentLockStatus)
      toast.success(`${actionText} tài khoản thành công!`)
      await fetchUsersList()
    } catch (err: any) {
      console.error(err)
      toast.error("Cập nhật khóa tài khoản thất bại.", err.response?.data?.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Người Dùng</h1>
        <p className="text-muted-foreground mt-1">Giám sát và thiết lập trạng thái Khóa/Mở khóa các tài khoản trong hệ thống.</p>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none"
            placeholder="Tìm kiếm theo email, tên hiển thị..."
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none min-w-[150px]"
        >
          <option value="">Tất cả vai trò</option>
          <option value="Client">Client</option>
          <option value="Expert">Expert</option>
          <option value="Admin">Admin</option>
        </select>
        
        <Button type="submit" className="bg-primary text-primary-foreground font-semibold px-6">
          Tìm kiếm
        </Button>
      </form>

      {/* Users List Table */}
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
        if (users.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground">Không tìm thấy người dùng</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                Thử thay đổi từ khóa hoặc bộ lọc để tìm được nhiều kết quả hơn.
              </p>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {users.map((u) => (
                <div key={u.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">{u.fullName}</h3>
                      <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground border border-border">
                        {u.role}
                      </span>
                      {u.isLocked && (
                        <span className="inline-flex rounded-full bg-destructive/15 text-destructive border border-destructive/20 px-2 py-0.5 text-[9px] font-bold">
                          Đang khóa
                        </span>
                      )}
                      {u.id === myId && (
                        <span className="inline-flex rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[9px] font-bold">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Email: {u.email} • ID: #{u.id}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Không cho tự khoá mình: khoá xong là mất luôn quyền vào mở khoá,
                        chỉ còn cách sửa tay dưới database. BE cũng đã chặn (SetUserLockCommand). */}
                    {u.id === myId ? (
                      <span className="w-full md:w-auto text-xs text-muted-foreground italic px-2">
                        Không thể tự khoá tài khoản của mình
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleToggleLock(u.id, u.isLocked)}
                        variant="outline"
                        size="sm"
                        className={`w-full md:w-auto text-xs font-semibold flex items-center gap-1 border-border ${
                          u.isLocked
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-destructive hover:bg-destructive/5"
                        }`}
                      >
                        {u.isLocked ? (
                          <>
                            <Unlock className="h-3.5 w-3.5" />
                            Mở khóa
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            Khóa tài khoản
                          </>
                        )}
                      </Button>
                    )}
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
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="border-border hover:bg-secondary"
                >
                  Trước
                </Button>
                <span className="text-sm font-semibold text-muted-foreground">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="border-border hover:bg-secondary"
                >
                  Tiếp
                </Button>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
