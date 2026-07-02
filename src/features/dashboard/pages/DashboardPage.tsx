import React from "react"
import { useAuthStore } from "@/features/auth/store"
import {
  Briefcase,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  PlusCircle,
} from "lucide-react"
import { Link } from "react-router-dom"

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()

  if (!user) return null

  // Render Dashboard của Client
  const renderClientDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Khách hàng Dashboard</h1>
        <p className="text-muted-foreground mt-1">Quản lý các công việc đăng tuyển và dự án của bạn.</p>
      </div>

      {/* Grid thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tổng số Job đã đăng</span>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">công việc</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Proposals đang chờ duyệt</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              0%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Dự án đang triển khai</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">đang chạy</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Quỹ ký gửi (Escrow)</span>
            <DollarSign className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-xs text-muted-foreground">được bảo mật</span>
          </div>
        </div>
      </div>

      {/* Content chính */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Công việc vừa đăng gần đây</h3>
          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Bạn chưa đăng công việc nào</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Đăng job ngay để AI giúp bạn tối ưu hóa mô tả và kết nối tới các Expert hàng đầu.
            </p>
            <Link to="/jobs/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all">
              <PlusCircle className="h-4 w-4" />
              Đăng Job mới
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Hợp đồng & Dự án hiện tại</h3>
          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Chưa có dự án nào đang chạy</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Dự án sẽ tự động kích hoạt khi bạn phê duyệt proposal của Expert.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render Dashboard của Expert
  const renderExpertDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Expert Dashboard</h1>
        <p className="text-muted-foreground mt-1">Theo dõi các proposal, hợp đồng và thu nhập của bạn.</p>
      </div>

      {/* Grid thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Proposals đã nộp</span>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">đơn ứng tuyển</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Dự án đang thực hiện</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">đang xử lý</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Số dư tạm khóa</span>
            <DollarSign className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-xs text-muted-foreground">đang trong Escrow</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Đã giải ngân</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-xs text-muted-foreground">hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Content chính */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Đề xuất ứng tuyển gần đây</h3>
          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Bạn chưa nộp đề xuất nào</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Tìm kiếm các job phù hợp với kỹ năng của bạn và nộp proposal ngay.
            </p>
            <Link to="/jobs" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all">
              Tìm Job mới
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Các dự án đang làm</h3>
          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Bạn chưa có dự án nào đang chạy</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Dự án sẽ xuất hiện ở đây khi Client chấp nhận proposal của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Render Dashboard của Admin
  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Portal</h1>
        <p className="text-muted-foreground mt-1">Giám sát hoạt động và quản lý hệ thống AI Tasker.</p>
      </div>

      {/* Grid thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tổng số Users</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">Client / Expert</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tổng số Jobs</span>
            <Briefcase className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">đang hoạt động</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Chứng chỉ chờ duyệt</span>
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-xs text-muted-foreground">cần duyệt</span>
          </div>
        </div>
      </div>

      {/* Content chính */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold">Hoạt động hệ thống</h3>
        <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Hệ thống đang hoạt động ổn định</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Hiện tại các gRPC connections đến dịch vụ backend đang được giám sát từ xa.
          </p>
        </div>
      </div>
    </div>
  )

  switch (user.role) {
    case "Client":
      return renderClientDashboard()
    case "Expert":
      return renderExpertDashboard()
    case "Admin":
      return renderAdminDashboard()
    default:
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold">Chào mừng đến với AI Tasker</h1>
          <p className="text-muted-foreground mt-2">Vui lòng đăng nhập bằng tài khoản có vai trò xác định.</p>
        </div>
      )
  }
}
