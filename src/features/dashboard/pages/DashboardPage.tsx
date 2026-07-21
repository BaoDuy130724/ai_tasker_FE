import React, { useEffect, useState } from "react"
import { useAuthStore } from "@/features/auth/store"
import { getJobs } from "@/features/jobs/api"
import type { Job } from "@/features/jobs/types"
import { getProposalsByJob, getMyProposals } from "@/features/proposals/api"
import type { Proposal } from "@/features/proposals/types"
import { ProposalStatus } from "@/features/proposals/types"
import { getProjects } from "@/features/contracts-projects/api"
import type { Project } from "@/features/contracts-projects/types"
import { ProjectStatus } from "@/features/contracts-projects/types"
import { getDashboardKpi, refreshDashboardKpi, getPendingCertificates } from "@/features/admin/api"
import type { DashboardKpi } from "@/features/admin/types"
import {
  Briefcase,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Users,
  ShieldCheck,
  Layers,
  RefreshCw,
  PlusCircle,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useToast } from "@/shared/ui/use-toast"

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

const KpiTile: React.FC<{
  label: string
  value: React.ReactNode
  hint?: string
  icon: React.ReactNode
  /** Có `to` thì tile thành link điều hướng, kèm affordance hover. */
  to?: string
}> = ({ label, value, hint, icon, to }) => {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </>
  )

  if (!to) {
    return <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{body}</div>
  }

  return (
    <Link
      to={to}
      className="group block rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {body}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Xem chi tiết
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  )
}

const KpiSkeleton: React.FC = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="animate-pulse h-28 rounded-xl bg-card border border-border" />
    ))}
  </div>
)

const EmptyPanel: React.FC<{ icon: React.ReactNode; title: string; hint: string; action?: React.ReactNode }> = ({
  icon,
  title,
  hint,
  action,
}) => (
  <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
    {icon}
    <p className="text-sm font-medium mt-3">{title}</p>
    <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">{hint}</p>
    {action}
  </div>
)

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const toast = useToast()

  // Client
  const [clientJobs, setClientJobs] = useState<Job[]>([])
  const [clientProjects, setClientProjects] = useState<Project[]>([])
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0)

  // Expert
  const [expertProposals, setExpertProposals] = useState<Proposal[]>([])
  const [expertProjects, setExpertProjects] = useState<Project[]>([])

  // Admin
  const [kpi, setKpi] = useState<DashboardKpi | null>(null)
  const [pendingCertCount, setPendingCertCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadClient = async () => {
      const jobsData = await getJobs({ page: 1, pageSize: 100 })
      const myJobs = (jobsData?.items || []).filter((j) => j.clientId === Number(user.id))
      const projects = await getProjects()
      setClientJobs(myJobs)
      setClientProjects(projects)

      // Không có endpoint "my pending proposals" gộp — đếm bằng cách duyệt proposal của từng job.
      const proposalsPerJob = await Promise.all(myJobs.map((j) => getProposalsByJob(j.id)))
      const pending = proposalsPerJob.flat().filter((p) => p.status === ProposalStatus.Pending).length
      setPendingProposalsCount(pending)
    }

    const loadExpert = async () => {
      const [proposals, projects] = await Promise.all([getMyProposals(), getProjects()])
      setExpertProposals(proposals)
      setExpertProjects(projects)
    }

    const loadAdmin = async () => {
      const [kpiData, pendingCerts] = await Promise.all([getDashboardKpi(), getPendingCertificates()])
      setKpi(kpiData || null)
      setPendingCertCount(pendingCerts.length)
    }

    const load = async () => {
      setIsLoading(true)
      try {
        if (user.role === "Client") await loadClient()
        else if (user.role === "Expert") await loadExpert()
        else if (user.role === "Admin") await loadAdmin()
      } catch (error) {
        console.error("Lỗi tải dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) return null

  // Render Dashboard của Client
  const renderClientDashboard = () => {
    const activeProjects = clientProjects.filter((p) => p.status !== ProjectStatus.Closed)
    const escrowTotal = clientProjects.reduce((sum, p) => sum + (p.escrowTotalBalance || 0), 0)
    const recentJobs = [...clientJobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    const recentProjects = [...clientProjects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Khách hàng Dashboard</h1>
          <p className="text-muted-foreground mt-1">Quản lý các công việc đăng tuyển và dự án của bạn.</p>
        </div>

        {isLoading ? (
          <KpiSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Tổng số Job đã đăng"
              value={clientJobs.length}
              hint="công việc"
              icon={<Briefcase className="h-5 w-5 text-primary" />}
            />
            <KpiTile
              label="Proposals đang chờ duyệt"
              value={pendingProposalsCount}
              hint="cần xét duyệt"
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              to="/client/jobs"
            />
            <KpiTile
              label="Dự án đang triển khai"
              value={activeProjects.length}
              hint="đang chạy"
              icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
            />
            <KpiTile
              label="Quỹ ký gửi (Escrow)"
              value={`$${escrowTotal.toLocaleString("vi-VN")}`}
              hint="được bảo mật"
              icon={<DollarSign className="h-5 w-5 text-indigo-500" />}
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold">Công việc vừa đăng gần đây</h3>
            {recentJobs.length === 0 ? (
              <EmptyPanel
                icon={<Briefcase className="h-10 w-10 text-muted-foreground/40" />}
                title="Bạn chưa đăng công việc nào"
                hint="Đăng job ngay để AI giúp bạn tối ưu hóa mô tả và kết nối tới các Expert hàng đầu."
                action={
                  <Link to="/jobs/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all">
                    <PlusCircle className="h-4 w-4" />
                    Đăng Job mới
                  </Link>
                }
              />
            ) : (
              <div className="mt-4 divide-y divide-border">
                {recentJobs.map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary/10 -mx-2 px-2 rounded-lg transition-all">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">${job.budget} · {formatDate(job.createdAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold">Hợp đồng & Dự án hiện tại</h3>
            {recentProjects.length === 0 ? (
              <EmptyPanel
                icon={<FileText className="h-10 w-10 text-muted-foreground/40" />}
                title="Chưa có dự án nào đang chạy"
                hint="Dự án sẽ tự động kích hoạt khi bạn phê duyệt proposal của Expert."
              />
            ) : (
              <div className="mt-4 divide-y divide-border">
                {recentProjects.map((proj) => (
                  <Link key={proj.id} to={`/projects/${proj.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary/10 -mx-2 px-2 rounded-lg transition-all">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">Dự án #{proj.id} — {proj.statusName}</p>
                      <p className="text-xs text-muted-foreground">${proj.proposedPrice} · {formatDate(proj.createdAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render Dashboard của Expert
  const renderExpertDashboard = () => {
    const activeProjects = expertProjects.filter((p) => p.status !== ProjectStatus.Closed)
    // Locked = phần Client đã ký quỹ nhưng CHƯA nghiệm thu. Available = Expert ĐÃ được duyệt
    // nhưng chỉ rút được khi dự án đóng — không phải "tiền rút được ngay" như nhãn cũ ghi.
    const pendingBalance = expertProjects.reduce((sum, p) => sum + (p.escrowLockedBalance || 0), 0)
    const earnedBalance = expertProjects.reduce((sum, p) => sum + (p.escrowAvailableBalance || 0), 0)
    const withdrawableBalance = expertProjects
      .filter((p) => p.status === ProjectStatus.Closed || p.status === ProjectStatus.Cancelled)
      .reduce((sum, p) => sum + (p.escrowAvailableBalance || 0), 0)
    const recentProposals = [...expertProposals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    const recentProjects = [...expertProjects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Expert Dashboard</h1>
          <p className="text-muted-foreground mt-1">Theo dõi các proposal, hợp đồng và thu nhập của bạn.</p>
        </div>

        {isLoading ? (
          <KpiSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Proposals đã nộp"
              value={expertProposals.length}
              hint="đơn ứng tuyển"
              icon={<FileText className="h-5 w-5 text-primary" />}
            />
            <KpiTile
              label="Dự án đang thực hiện"
              value={activeProjects.length}
              hint="đang xử lý"
              icon={<Clock className="h-5 w-5 text-amber-500" />}
            />
            <KpiTile
              label="Chờ nghiệm thu"
              value={`$${pendingBalance.toLocaleString("vi-VN")}`}
              hint="Client chưa duyệt"
              icon={<DollarSign className="h-5 w-5 text-indigo-500" />}
            />
            <KpiTile
              label="Đã nghiệm thu"
              value={`$${earnedBalance.toLocaleString("vi-VN")}`}
              hint={
                withdrawableBalance > 0
                  ? `rút được $${withdrawableBalance.toLocaleString("vi-VN")}`
                  : "rút khi dự án đóng"
              }
              icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
            />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold">Đề xuất ứng tuyển gần đây</h3>
            {recentProposals.length === 0 ? (
              <EmptyPanel
                icon={<FileText className="h-10 w-10 text-muted-foreground/40" />}
                title="Bạn chưa nộp đề xuất nào"
                hint="Tìm kiếm các job phù hợp với kỹ năng của bạn và nộp proposal ngay."
                action={
                  <Link to="/jobs" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all">
                    Tìm Job mới
                  </Link>
                }
              />
            ) : (
              <div className="mt-4 divide-y divide-border">
                {recentProposals.map((p) => (
                  <Link key={p.id} to={`/jobs/${p.jobId}`} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary/10 -mx-2 px-2 rounded-lg transition-all">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">Job #{p.jobId} · ${p.proposedPrice}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold">Các dự án đang làm</h3>
            {recentProjects.length === 0 ? (
              <EmptyPanel
                icon={<Briefcase className="h-10 w-10 text-muted-foreground/40" />}
                title="Bạn chưa có dự án nào đang chạy"
                hint="Dự án sẽ xuất hiện ở đây khi Client chấp nhận proposal của bạn."
              />
            ) : (
              <div className="mt-4 divide-y divide-border">
                {recentProjects.map((proj) => (
                  <Link key={proj.id} to={`/projects/${proj.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary/10 -mx-2 px-2 rounded-lg transition-all">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">Dự án #{proj.id} — {proj.statusName}</p>
                      <p className="text-xs text-muted-foreground">${proj.proposedPrice} · {formatDate(proj.createdAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Đồng bộ lại KPI qua gRPC rồi tải lại số liệu Admin
  const handleRefreshKpi = async () => {
    setIsRefreshing(true)
    try {
      await refreshDashboardKpi()
      const [kpiData, pendingCerts] = await Promise.all([getDashboardKpi(), getPendingCertificates()])
      setKpi(kpiData || null)
      setPendingCertCount(pendingCerts.length)
      toast.success("Đồng bộ dữ liệu KPI qua gRPC thành công!")
    } catch (err) {
      console.error(err)
      toast.error("Làm mới KPI qua gRPC thất bại.", "Kiểm tra lại kết nối tới các microservice.")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Render Dashboard của Admin
  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Portal</h1>
          <p className="text-muted-foreground mt-1">Giám sát hoạt động và quản lý hệ thống AI Tasker.</p>
        </div>
        <Button
          onClick={handleRefreshKpi}
          disabled={isRefreshing}
          className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Đồng bộ gRPC 🔄
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-28 rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Tổng số Users"
            value={kpi?.totalUsers ?? "—"}
            hint="Client / Expert"
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <KpiTile
            label="Tổng số Jobs"
            value={kpi?.totalJobs ?? "—"}
            hint="đang hoạt động"
            icon={<Briefcase className="h-5 w-5 text-indigo-500" />}
          />
          <KpiTile
            label="Tổng dịch vụ AI"
            value={kpi?.totalServices ?? "—"}
            hint="trên marketplace"
            icon={<Layers className="h-5 w-5 text-purple-500" />}
          />
          <KpiTile
            label="Chứng chỉ chờ duyệt"
            value={pendingCertCount}
            hint="cần duyệt"
            icon={<ShieldCheck className="h-5 w-5 text-amber-500" />}
          />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold">Hoạt động hệ thống</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/users" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary/40 transition-all">
            Quản lý người dùng
          </Link>
          <Link to="/admin/jobs" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary/40 transition-all">
            Kiểm duyệt Job
          </Link>
          <Link to="/admin/services" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary/40 transition-all">
            Kiểm duyệt Dịch vụ
          </Link>
          <Link to="/admin/disputes" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary/40 transition-all">
            Xử lý tranh chấp
          </Link>
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
