import React, { useEffect, useState, useRef } from "react"
import { getMyProposals } from "../api"
import type { Proposal } from "../types"
import { ProposalStatus } from "../types"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, Clock, Calendar, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { JobLink } from "@/shared/components/JobLink"
import { getProjects } from "@/features/contracts-projects/api"

type StatusTab = "pending" | "accepted" | "rejected"

const STATUS_TABS: { key: StatusTab; label: string; status: ProposalStatus }[] = [
  { key: "pending", label: "Đang chờ", status: ProposalStatus.Pending },
  { key: "accepted", label: "Được duyệt", status: ProposalStatus.Accepted },
  { key: "rejected", label: "Bị từ chối", status: ProposalStatus.Rejected },
]

export const ExpertProposalListPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Mặc định "Đang chờ": đây là thứ Expert cần theo dõi. Proposal đã duyệt thì
  // việc thật nằm ở trang Dự án, đã có nút dẫn sang.
  const [statusTab, setStatusTab] = useState<StatusTab>("pending")
  // jobId → projectId, để proposal được duyệt dẫn thẳng sang dự án tương ứng
  // thay vì làm dòng chết chỉ trỏ về lại tin tuyển dụng.
  const [projectIdByJobId, setProjectIdByJobId] = useState<Record<number, number>>({})
  const hasLoadedOnce = useRef(false)

  const fetchProposals = async () => {
    setIsLoading(true)
    try {
      const data = await getMyProposals()
      setProposals(data)
      hasLoadedOnce.current = true
    } catch (err) {
      console.error("Lỗi tải danh sách proposal:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [])

  // Chỉ tải danh sách dự án khi thực sự có proposal được duyệt — không có thì
  // request này chẳng dùng vào đâu.
  useEffect(() => {
    if (!proposals.some((p) => p.status === ProposalStatus.Accepted)) return
    let cancelled = false
    getProjects()
      .then((projects) => {
        if (cancelled) return
        const map: Record<number, number> = {}
        for (const proj of projects) {
          if (proj.jobId != null) map[proj.jobId] = proj.id
        }
        setProjectIdByJobId(map)
      })
      .catch((err) => console.error("Lỗi tải dự án để nối với proposal:", err))
    return () => {
      cancelled = true
    }
  }, [proposals])

  const getStatusStyle = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.Pending:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20"
      case ProposalStatus.Accepted:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case ProposalStatus.Rejected:
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusName = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.Pending:
        return "Đang chờ duyệt"
      case ProposalStatus.Accepted:
        return "Được chấp nhận"
      case ProposalStatus.Rejected:
        return "Bị từ chối"
      default:
        return "Không rõ"
    }
  }

  const counts = {
    pending: proposals.filter((p) => p.status === ProposalStatus.Pending).length,
    accepted: proposals.filter((p) => p.status === ProposalStatus.Accepted).length,
    rejected: proposals.filter((p) => p.status === ProposalStatus.Rejected).length,
  }
  const activeStatus = STATUS_TABS.find((t) => t.key === statusTab)!.status
  const visibleProposals = proposals.filter((p) => p.status === activeStatus)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Đề Xuất Ứng Tuyển Của Tôi</h1>
        <p className="text-muted-foreground mt-1">Danh sách và trạng thái các proposal bạn đã nộp cho các tin tuyển dụng.</p>
      </div>

      {!isLoading && proposals.length > 0 && (
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 font-normal opacity-70">({counts[tab.key]})</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && !hasLoadedOnce.current ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-5 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Bạn chưa nộp đề xuất nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Khám phá các Job đang tuyển và nộp đề xuất ứng tuyển ngay hôm nay.
          </p>
          <Link to="/jobs" className="mt-4">
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold">
              Tìm việc làm
            </Button>
          </Link>
        </div>
      ) : visibleProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold text-foreground">
            {statusTab === "pending"
              ? "Không có đề xuất nào đang chờ"
              : statusTab === "accepted"
              ? "Chưa có đề xuất nào được duyệt"
              : "Chưa có đề xuất nào bị từ chối"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
            Chuyển sang tab khác để xem các đề xuất còn lại của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleProposals.map((proposal) => (
            <div key={proposal.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusStyle(proposal.status)}`}>
                      {getStatusName(proposal.status)}
                    </span>
                  </div>
                  {/* Tiêu đề job thay cho "Job ID #x" — id không mang thông tin gì cho người dùng. */}
                  <JobLink
                    jobId={proposal.jobId}
                    className="font-extrabold text-lg text-primary hover:underline block"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground bg-secondary/30 border px-3.5 py-2 rounded-xl">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    ${proposal.proposedPrice}
                  </span>
                  <span className="border-l h-4" />
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    {proposal.estimatedDays} ngày bàn giao
                  </span>
                </div>
              </div>

              <div className="py-4 space-y-3">
                <div className="text-sm leading-relaxed bg-secondary/10 p-4 rounded-lg border">
                  <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Nội dung đề cử ứng tuyển:</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{proposal.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Ngày nộp: {new Date(proposal.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-4 mt-2">
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link to={`/jobs/${proposal.jobId}`}>Xem chi tiết Job</Link>
                </Button>

                {/* Đề xuất được duyệt: việc thật đã chuyển sang Dự án — dẫn thẳng sang đó,
                    thay vì để dòng này chỉ trỏ ngược về tin tuyển dụng. */}
                {proposal.status === ProposalStatus.Accepted &&
                  projectIdByJobId[proposal.jobId] != null && (
                    <Button asChild size="sm" className="text-xs font-semibold">
                      <Link to={`/projects/${projectIdByJobId[proposal.jobId]}`}>
                        Đến trang dự án
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
