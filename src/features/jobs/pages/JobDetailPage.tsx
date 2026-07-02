import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { getJobById, closeJob } from "../api"
import type { Job } from "../types"
import { JobStatus } from "../types"
import { useAuthStore } from "@/features/auth/store"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, ArrowLeft, ShieldAlert, Sparkles, UserCheck } from "lucide-react"

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const fetchJobDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getJobById(Number(id))
      setJob(data)
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Không tìm thấy thông tin công việc tuyển dụng.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobDetail()
  }, [id])

  const handleCloseJob = async () => {
    if (!job || !user) return
    if (!window.confirm("Bạn có chắc chắn muốn đóng tin tuyển dụng này? Expert sẽ không thể nộp proposal nữa.")) return
    
    setIsClosing(true)
    try {
      await closeJob(job.id, Number(user.id))
      await fetchJobDetail() // Load lại chi tiết sau khi đóng
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || "Đóng công việc thất bại. Chỉ chủ sở hữu mới có quyền.")
    } finally {
      setIsClosing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-8 w-1/2 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (errorMsg || !job) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Lỗi tải dữ liệu</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Không thể tải chi tiết công việc."}</p>
        <Link to="/" className="text-primary hover:underline text-sm font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
      </div>
    )
  }

  const isOwner = user && job.clientId === Number(user.id)
  const isExpert = user && user.role === "Expert"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      {/* Main Details Card */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                job.status === JobStatus.Open
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {job.status === JobStatus.Open ? "Đang nhận đề xuất" : "Đã đóng"}
              </span>
              <span className="text-xs text-muted-foreground">Đăng ngày {formatDate(job.createdAt)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{job.title}</h1>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 whitespace-nowrap">
            <span className="text-xs text-muted-foreground font-semibold">Ngân sách dự án</span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-4 py-1.5 text-lg font-bold border border-primary/20">
              <DollarSign className="h-5 w-5" />
              {job.budget} USD
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/30 rounded-xl p-4 border border-border/50 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Hạn chót ứng tuyển</p>
              <p className="font-semibold">{formatDate(job.deadline)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Mã nhà tuyển dụng (Client ID)</p>
              <p className="font-semibold">#{job.clientId} {isOwner && "(Bạn)"}</p>
            </div>
          </div>
        </div>

        {/* Skills Required */}
        <div className="space-y-2">
          <h3 className="font-bold text-foreground">Yêu cầu kỹ năng</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span key={s} className="inline-flex rounded-full bg-secondary px-3.5 py-1 text-xs font-semibold text-foreground border border-border">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Full Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-foreground">Mô tả công việc</h3>
          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-secondary/10 p-5 rounded-xl border border-border/40">
            {job.description}
          </div>
        </div>

        {/* Action Panel */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-end gap-3">
          {/* Đối với chủ sở hữu Job (Client) */}
          {isOwner && (
            <>
              {job.status === JobStatus.Open && (
                <Button
                  onClick={handleCloseJob}
                  disabled={isClosing}
                  variant="destructive"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4" />
                  {isClosing ? "Đang đóng..." : "Đóng tin tuyển dụng"}
                </Button>
              )}
              <Button
                variant="outline"
                className="border-border hover:bg-secondary transition-all"
                disabled
              >
                Chỉnh sửa công việc (Phase sau)
              </Button>
            </>
          )}

          {/* Đối với Freelancer (Expert) */}
          {isExpert && job.status === JobStatus.Open && (
            <Link to={`/expert/proposals/new?jobId=${job.id}`}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm flex items-center gap-1.5 w-full md:w-auto">
                <Sparkles className="h-4 w-4" />
                Nộp proposal ứng tuyển ngay
              </Button>
            </Link>
          )}

          {!user && (
            <p className="text-xs text-muted-foreground italic">
              Vui lòng <Link to="/login" className="text-primary underline">Đăng nhập</Link> để nộp hồ sơ ứng tuyển công việc này.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
