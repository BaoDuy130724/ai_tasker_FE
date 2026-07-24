import React, { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { getProjects } from "../api"
import type { Project } from "../types"
import { ProjectStatus } from "../types"
import { Button } from "@/components/ui/button"
import { Briefcase, DollarSign, Calendar, ArrowRight, Activity } from "lucide-react"
import { ProjectName } from "@/shared/components/ProjectName"

export const ProjectListPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    const fetchProjectsList = async () => {
      setIsLoading(true)
      try {
        const data = await getProjects()
        setProjects(data)
        hasLoadedOnce.current = true
      } catch (error) {
        console.error("Lỗi fetch projects list:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjectsList()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Created:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
      case ProjectStatus.InProgress:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case ProjectStatus.Delivered:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case ProjectStatus.Approved:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case ProjectStatus.Closed:
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dự án & Hợp đồng</h1>
        <p className="text-muted-foreground mt-1">Theo dõi tiến trình hợp tác, giao nộp sản phẩm và quản lý quỹ ký quỹ.</p>
      </div>

      {(() => {
        if (isLoading && !hasLoadedOnce.current) {
          return (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-3">
                  <div className="h-5 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          )
        }
        if (projects.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground">Chưa có dự án nào đang chạy</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                Dự án mới sẽ tự động được khởi tạo ngay khi Client phê duyệt đề xuất ứng tuyển của Expert.
              </p>
            </div>
          )
        }
        return (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {projects.map((proj) => (
              <div key={proj.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-secondary/10 transition-all">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary shrink-0" />
                      <ProjectName jobId={proj.jobId} serviceId={proj.serviceId} />
                    </h3>
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusStyle(proj.status)}`}>
                      {proj.statusName}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      Trị giá hợp đồng: <strong>${proj.proposedPrice}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Bắt đầu: {formatDate(proj.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Link to={`/projects/${proj.id}`} className="w-full md:w-auto">
                    <Button variant="outline" size="sm" className="w-full border-border hover:bg-secondary font-semibold flex items-center gap-1">
                      Quản lý dự án
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
