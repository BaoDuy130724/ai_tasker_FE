import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getJobs } from "../api"
import type { Job } from "../types"
import { JobStatus } from "../types"
import { useAuthStore } from "@/features/auth/store"
import { Button } from "@/components/ui/button"
import { Briefcase, DollarSign, Calendar, PlusCircle, ArrowRight } from "lucide-react"

export const ClientJobListPage: React.FC = () => {
  const { user } = useAuthStore()
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMyJobs = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // Gọi API lấy danh sách jobs lớn rồi filter client-side vì API BE chưa hỗ trợ query clientId
      const data = await getJobs({
        page: 1,
        pageSize: 100, // Lấy trang đầu tiên với lượng job lớn để demo
      })
      const filtered = data?.items?.filter((j: Job) => j.clientId === Number(user.id)) || []
      setMyJobs(filtered)
    } catch (error) {
      console.error("Lỗi fetch client jobs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMyJobs()
  }, [user])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Công việc đã đăng tuyển</h1>
          <p className="text-muted-foreground mt-1">Quản lý và đóng/mở ứng tuyển các tin tuyển dụng của bạn.</p>
        </div>
        <Link to="/jobs/new">
          <Button className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all">
            <PlusCircle className="h-4 w-4" />
            Đăng Job mới
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-5 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : myJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Bạn chưa đăng tin tuyển dụng nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Đăng job tuyển dụng đầu tiên của bạn để AI đề xuất các Expert phù hợp nhất.
          </p>
          <Link to="/jobs/new" className="mt-4">
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold flex items-center gap-1 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              Đăng tuyển ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {myJobs.map((job) => (
            <div key={job.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">{job.title}</h3>
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                    job.status === JobStatus.Open
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {job.status === JobStatus.Open ? "Mở" : "Đã đóng"}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-primary" />
                    Ngân sách: <strong>${job.budget}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Hạn chót: {formatDate(job.deadline)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {job.skills.map((s) => (
                    <span key={s} className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground border border-border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {job.status === JobStatus.Open && (
                  <Link to={`/jobs/${job.id}/proposals`} className="w-full md:w-auto">
                    <Button size="sm" className="w-full bg-primary text-primary-foreground font-semibold flex items-center gap-1 hover:bg-primary/95 transition-all">
                      Xem Proposals
                    </Button>
                  </Link>
                )}
                <Link to={`/jobs/${job.id}`} className="w-full md:w-auto">
                  <Button variant="outline" size="sm" className="w-full border-border hover:bg-secondary font-semibold flex items-center gap-1">
                    Chi tiết
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
