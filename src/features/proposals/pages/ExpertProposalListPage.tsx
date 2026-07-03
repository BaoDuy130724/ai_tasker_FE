import React, { useEffect, useState } from "react"
import { getMyProposals } from "../api"
import type { Proposal } from "../types"
import { ProposalStatus } from "../types"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, Clock, Calendar } from "lucide-react"
import { Link } from "react-router-dom"

export const ExpertProposalListPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchProposals = async () => {
    setIsLoading(true)
    try {
      const data = await getMyProposals()
      setProposals(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [])

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Đề Xuất Ứng Tuyển Của Tôi</h1>
        <p className="text-muted-foreground mt-1">Danh sách và trạng thái các proposal bạn đã nộp cho các tin tuyển dụng.</p>
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
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Mã đề xuất: #{proposal.id}</span>
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusStyle(proposal.status)}`}>
                      {getStatusName(proposal.status)}
                    </span>
                  </div>
                  <Link to={`/jobs/${proposal.jobId}`} className="font-extrabold text-lg text-primary hover:underline block">
                    Đề xuất cho Job ID #{proposal.jobId}
                  </Link>
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

              <div className="flex justify-end gap-2 border-t border-border/40 pt-4 mt-2">
                <Link to={`/jobs/${proposal.jobId}`}>
                  <Button variant="outline" size="sm" className="border-border text-xs">
                    Xem chi tiết Job
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
