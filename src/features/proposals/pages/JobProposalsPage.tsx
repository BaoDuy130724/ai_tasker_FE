import React, { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useSafeBack } from "@/shared/hooks/useSafeBack"
import { useToast } from "@/shared/ui/use-toast"
import { useConfirm } from "@/shared/ui/use-confirm"
import { getJobById } from "@/features/jobs/api"
import type { Job } from "@/features/jobs/types"
import { getProposalsByJob } from "../api"
import type { Proposal } from "../types"
import { ProposalStatus } from "../types"
import { approveProposal } from "@/features/contracts-projects/api"
import type { Contract } from "@/features/contracts-projects/types"
import { ContractSignedModal } from "@/features/contracts-projects/components/ContractSignedModal"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, DollarSign, ShieldCheck, UserCheck, ShieldAlert } from "lucide-react"
import { UserLink } from "@/shared/components/UserLink"

export const JobProposalsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const goBack = useSafeBack()
  const toast = useToast()
  const confirm = useConfirm()
  
  const [job, setJob] = useState<Job | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<number | null>(null)
  // BE không có endpoint GET lại Contract sau khi tạo — đây là cơ hội DUY NHẤT thấy điều khoản hợp đồng,
  // nên hiện ngay trong modal thay vì chỉ lấy project.id rồi bỏ qua toàn bộ object Contract.
  const [approvedContract, setApprovedContract] = useState<{ contract: Contract; projectId: number } | null>(null)

  const fetchData = useCallback(async () => {
    if (!jobId) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [jobData, proposalsData] = await Promise.all([
        getJobById(Number(jobId)),
        getProposalsByJob(Number(jobId)),
      ])
      setJob(jobData)
      setProposals(proposalsData)
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Lỗi tải thông tin công việc hoặc danh sách proposals.")
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (proposalId: number) => {
    const ok = await confirm({
      title: "Phê duyệt đề xuất này?",
      description:
        "Dự án và Hợp đồng mới sẽ tự động được tạo ra, đồng thời mọi đề xuất khác của job này sẽ bị từ chối. Thao tác không thể hoàn tác.",
      confirmText: "Phê duyệt",
      variant: "warning",
    })
    if (!ok) return


    setApprovingId(proposalId)
    try {
      const result = await approveProposal(proposalId)
      if (result?.contract && result?.project?.id) {
        setApprovedContract({ contract: result.contract, projectId: result.project.id })
      } else if (result?.project?.id) {
        navigate(`/projects/${result.project.id}`)
      } else {
        // Duyệt xong luôn sinh ra project -> về danh sách dự án thay vì trang chủ.
        navigate("/client/projects")
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Phê duyệt thất bại.", err.response?.data?.message ?? "Vui lòng thử lại.")
    } finally {
      setApprovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-32 w-full bg-muted rounded-xl" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 w-full bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (errorMsg || !job) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Không tải được dữ liệu</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Lỗi nạp thông tin."}</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      {/* Job Header Info */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
          <h2 className="font-extrabold text-xl text-foreground">Danh sách đề xuất ứng tuyển</h2>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold border border-primary/20">
            Ngân sách: ${job.budget}
          </span>
        </div>
        <div>
          <h3 className="font-bold text-base text-muted-foreground">Tin tuyển dụng:</h3>
          <p className="font-bold text-lg text-foreground mt-0.5">{job.title}</p>
        </div>
      </div>

      {/* Proposals list */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg text-foreground">Các đề xuất đã nộp ({proposals.length})</h3>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl">
            <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold">Chưa có Expert nào nộp đề xuất</p>
            <p className="text-xs text-muted-foreground mt-1">Tin đăng tuyển của bạn sẽ thu hút ứng viên trong thời gian sớm nhất.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((prop) => (
              <div key={prop.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-foreground border border-border px-2.5 py-0.5 rounded-full">
                      <UserCheck className="h-3.5 w-3.5" />
                      <UserLink userId={prop.expertId} className="hover:underline" />
                    </span>
                    <span className="text-xs text-muted-foreground">Nộp ngày {new Date(prop.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-secondary/20 p-2.5 rounded-lg border border-border/40 max-w-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      Yêu cầu: ${prop.proposedPrice}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      Dự kiến: {prop.estimatedDays} ngày
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pt-2">
                    {prop.description}
                  </p>
                </div>

                <div className="flex flex-col justify-center items-end whitespace-nowrap min-w-[150px]">
                  {prop.status === ProposalStatus.Pending ? (
                    <Button
                      onClick={() => handleApprove(prop.id)}
                      disabled={approvingId !== null}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm flex items-center gap-1.5 w-full md:w-auto"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {approvingId === prop.id ? "Đang duyệt..." : "Phê duyệt đề xuất"}
                    </Button>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      prop.status === ProposalStatus.Accepted
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}>
                      {prop.status === ProposalStatus.Accepted ? "Được duyệt" : "Từ chối"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {approvedContract && (
        <ContractSignedModal
          contract={approvedContract.contract}
          onGoToProject={() => navigate(`/projects/${approvedContract.projectId}`)}
        />
      )}
    </div>
  )
}
