import React, { useEffect, useState } from "react"
import { getDashboardKpi, refreshDashboardKpi } from "../api"
import type { DashboardKpi } from "../types"
import { Button } from "@/components/ui/button"
import { ShieldAlert, RefreshCw, Users, Briefcase, Layers, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

export const AdminDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKpi | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchKpi = async () => {
    setIsLoading(true)
    try {
      const data = await getDashboardKpi()
      setKpis(data || null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKpi()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshDashboardKpi()
      alert("Đồng bộ dữ liệu KPI qua gRPC thành công!")
      await fetchKpi()
    } catch (err) {
      console.error(err)
      alert("Làm mới KPI qua gRPC thất bại. Vui lòng kiểm tra lại kết nối microservices.")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin System Dashboard</h1>
          <p className="text-muted-foreground mt-1">Giám sát hiệu năng và thống kê chỉ số KPI realtime của hệ thống microservices.</p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Đồng bộ gRPC 🔄
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-32 rounded-xl bg-card border" />
          ))}
        </div>
      ) : kpis ? (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Tổng người dùng</p>
                <p className="text-2xl font-extrabold mt-0.5">{kpis.totalUsers}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Tổng tin tuyển dụng</p>
                <p className="text-2xl font-extrabold mt-0.5">{kpis.totalJobs}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Tổng dịch vụ AI</p>
                <p className="text-2xl font-extrabold mt-0.5">{kpis.totalServices}</p>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg border-b pb-3">Phím tắt quản trị nhanh</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/users" className="block border rounded-xl p-4 hover:bg-secondary/40 transition-all">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  Quản lý tài khoản người dùng
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Tìm kiếm, lọc danh sách và Khóa/Mở khóa các tài khoản vi phạm chính sách.</p>
              </Link>

              <Link to="/admin/certificates" className="block border rounded-xl p-4 hover:bg-secondary/40 transition-all">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  Phê duyệt chứng chỉ chuyên môn
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Duyệt hồ sơ năng lực của các Expert để cấp dấu tích xanh uy tín.</p>
              </Link>

              <Link to="/admin/disputes" className="block border rounded-xl p-4 hover:bg-secondary/40 transition-all">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  Xử lý tranh chấp hợp đồng
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Xem xét bằng chứng khiếu nại và đưa ra phán quyết Escrow hoàn trả hoặc giải ngân.</p>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-xl">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Không tải được KPI</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Đảm bảo Service Admin và gRPC Gateway đang chạy ổn định.
          </p>
        </div>
      )}
    </div>
  )
}
