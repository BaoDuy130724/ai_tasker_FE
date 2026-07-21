import React, { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { useSafeBack } from "@/shared/hooks/useSafeBack"
import { useToast } from "@/shared/ui/use-toast"
import { useConfirm } from "@/shared/ui/use-confirm"
import { useAuthStore } from "@/features/auth/store"
import {
  getProjectById,
  createMilestone,
  approveMilestone,
  requestRevision,
  submitDeliverable,
  depositEscrow,
  withdrawEscrow,
  openDispute,
  cancelProject,
  getTransactionHistory
} from "../api"
import type { EscrowTransaction } from "../api"
import type { Project, Milestone } from "../types"
import { ProjectStatus } from "../types"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/utils"
import { ReviewSection } from "@/features/reviews/components/ReviewSection"
import { UserBrief } from "@/shared/components/UserLink"
import { MilestoneDeliverables } from "../components/MilestoneDeliverables"
import { ProjectName } from "@/shared/components/ProjectName"
import {
  DollarSign,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  PlayCircle,
  AlertTriangle,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Edit3,
  Gavel,
  XCircle
} from "lucide-react"

// Nhãn cho EscrowTransactionType (enum số từ BE): 0..4
const ESCROW_TYPE_LABELS = ["Deposit", "Lock", "Release", "Withdrawal", "Refund"]
// Nhãn cho EscrowTransactionStatus (enum số từ BE): 0 Pending, 1 Completed, 2 Failed
const ESCROW_STATUS_LABELS = ["Pending", "Completed", "Failed"]
const ESCROW_STATUS_STYLES = [
  "bg-amber-500/10 text-amber-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-destructive/10 text-destructive",
]

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const goBack = useSafeBack()
  const toast = useToast()
  const confirm = useConfirm()
  const { user } = useAuthStore()

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Dialog / Modal states
  const [activeModal, setActiveModal] = useState<
    "deposit" | "withdraw" | "createMilestone" | "submitDeliverable" | "requestRevision" | "openDispute" | null
  >(null)
  
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null)

  // Tăng lên sau mỗi lần nộp bài để MilestoneDeliverables tải lại.
  const [deliverableRefreshKey, setDeliverableRefreshKey] = useState(0)

  // Form states
  const [amountInput, setAmountInput] = useState(0)
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", dueDate: "", amount: 0 })
  const [deliverableForm, setDeliverableForm] = useState({ fileUrl: "", note: "" })
  const [revisionReason, setRevisionReason] = useState("")
  const [disputeForm, setDisputeForm] = useState({ description: "", evidenceFileUrl: "" })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateIdempotencyKey = () => {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
  }

  // Phần giá hợp đồng chưa được chia thành milestone. BE bắt buộc tổng milestone phải phủ
  // KÍN giá hợp đồng thì Expert mới nộp bài được, nên đây là con số Client cần đưa về 0.
  const allocatedAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
  const unallocatedAmount = (project?.proposedPrice ?? 0) - allocatedAmount

  const fetchProjectDetails = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getProjectById(Number(id))
      if (data) {
        setProject(data.project)
        setMilestones(data.milestones || [])

        // Lịch sử giao dịch là dữ liệu PHỤ. Trước đây nó nằm chung try với getProjectById,
        // nên chỉ cần call này lỗi là cả trang chuyển sang màn "Lỗi tải dữ liệu" dù project
        // đã tải xong. Nuốt lỗi ở đây và để danh sách giao dịch rỗng.
        try {
          const txs = await getTransactionHistory({ projectId: data.project.id, pageSize: 20 })
          setTransactions(txs)
        } catch (txErr) {
          console.error("Không tải được lịch sử giao dịch escrow:", txErr)
          setTransactions([])
        }
      }
    } catch (err: any) {
      console.error(err)
      // BE trả 403 (Forbid, không body) khi user không phải Client/Expert của project này.
      setErrorMsg(getApiErrorMessage(err, "Không tải được thông tin chi tiết dự án."))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProjectDetails()
  }, [fetchProjectDetails])

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || amountInput <= 0) return
    setIsSubmitting(true)
    try {
      await depositEscrow({
        projectId: project.id,
        amount: amountInput,
        idempotencyKey: generateIdempotencyKey(),
      })
      toast.success(`Đã nạp $${amountInput} vào quỹ ký quỹ!`)
      setActiveModal(null)
      setAmountInput(0)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Nạp tiền thất bại.", getApiErrorMessage(err, ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || amountInput <= 0) return
    setIsSubmitting(true)
    try {
      await withdrawEscrow({
        projectId: project.id,
        amount: amountInput,
        idempotencyKey: generateIdempotencyKey(),
      })
      toast.success(`Đã gửi yêu cầu rút $${amountInput}.`)
      setActiveModal(null)
      setAmountInput(0)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Rút tiền thất bại.", getApiErrorMessage(err, ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    
    // Trần của milestone là phần giá hợp đồng CHƯA được chia, không phải số dư Available.
    // Available giờ mang nghĩa "Expert đã nghiệm thu" nên lúc chia milestone nó luôn bằng 0 —
    // so với nó thì mọi milestone đều bị chặn.
    if (milestoneForm.amount > unallocatedAmount) {
      toast.error(
        "Vượt quá giá trị hợp đồng.",
        `Chỉ còn $${unallocatedAmount} chưa được chia trong tổng $${project.proposedPrice}.`
      )
      return
    }

    setIsSubmitting(true)
    try {
      await createMilestone({
        projectId: project.id,
        title: milestoneForm.title,
        description: milestoneForm.description,
        dueDate: milestoneForm.dueDate,
        amount: milestoneForm.amount,
        order: milestones.length + 1,
      })
      toast.success("Tạo Milestone mới thành công!")
      setActiveModal(null)
      setMilestoneForm({ title: "", description: "", dueDate: "", amount: 0 })
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Tạo Milestone thất bại.", getApiErrorMessage(err, ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelProject = async () => {
    if (!project) return
    // Hệ quả khác hẳn nhau tuỳ đã có bàn giao hay chưa, nên nói thẳng ra trước khi Client bấm.
    const ok = await confirm({
      title: "Dừng dự án này?",
      description: allocatedAmount > 0 || milestones.some((m) => m.status >= 2)
        ? "Expert đã bàn giao nên toàn bộ số tiền còn lại trong ký quỹ sẽ được chuyển cho Expert. Nếu bạn không hài lòng về sản phẩm, hãy mở tranh chấp thay vì dừng dự án."
        : "Expert chưa bàn giao gì nên toàn bộ tiền ký quỹ sẽ được hoàn lại cho bạn.",
      confirmText: "Dừng dự án",
      variant: "destructive",
    })
    if (!ok) return
    try {
      await cancelProject(project.id)
      toast.success("Đã dừng dự án.", "Tiền ký quỹ đã được xử lý theo tình trạng bàn giao.")
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Dừng dự án thất bại.", getApiErrorMessage(err, ""))
    }
  }

  const handleApproveMilestone = async (milestoneId: number) => {
    const ok = await confirm({
      title: "Duyệt milestone này?",
      description:
        "Số tiền của milestone sẽ được ghi nhận là của Expert và không thể thu hồi. Expert nhận " +
        "được tiền khi toàn bộ dự án hoàn thành.",
      confirmText: "Nghiệm thu",
      variant: "warning",
    })
    if (!ok) return
    try {
      await approveMilestone(milestoneId)
      toast.success("Đã duyệt Milestone và giải ngân tiền cho Expert!")
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Duyệt Milestone thất bại.", getApiErrorMessage(err, ""))
    }
  }

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMilestoneId === null || !revisionReason.trim()) return
    setIsSubmitting(true)
    try {
      await requestRevision(selectedMilestoneId, revisionReason)
      toast.success("Đã gửi yêu cầu sửa đổi tới Expert.")
      setActiveModal(null)
      setRevisionReason("")
      setSelectedMilestoneId(null)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Yêu cầu sửa đổi thất bại.", getApiErrorMessage(err, ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMilestoneId === null || !deliverableForm.fileUrl.trim()) return
    setIsSubmitting(true)
    try {
      await submitDeliverable({
        milestoneId: selectedMilestoneId,
        fileUrl: deliverableForm.fileUrl,
        note: deliverableForm.note,
      })
      toast.success("Nộp sản phẩm thành công!", "Đang chờ Client xét duyệt.")
      setActiveModal(null)
      setDeliverableForm({ fileUrl: "", note: "" })
      setSelectedMilestoneId(null)
      // Buộc các khối MilestoneDeliverables đang mở tải lại để thấy ngay bài vừa nộp.
      setDeliverableRefreshKey((k) => k + 1)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Nộp bài thất bại.", getApiErrorMessage(err, ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !disputeForm.description.trim()) return
    setIsSubmitting(true)
    try {
      await openDispute({
        projectId: project.id,
        description: disputeForm.description,
        evidenceFileUrl: disputeForm.evidenceFileUrl || null,
      })
      toast.success("Đã mở tranh chấp.", "Admin sẽ liên hệ và xem xét bằng chứng.")
      setActiveModal(null)
      setDisputeForm({ description: "", evidenceFileUrl: "" })
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      toast.error("Mở tranh chấp thất bại.", getApiErrorMessage(err, ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded-xl" />
        <div className="h-24 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (errorMsg || !project) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Lỗi tải dữ liệu</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Không tìm thấy dự án."}</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại Dashboard
        </Link>
      </div>
    )
  }

  // Closed và Cancelled đều là trạng thái kết thúc — không còn thao tác nghiệp vụ nào,
  // và cũng chính là lúc Expert rút được tiền.
  const isProjectEnded =
    project.status === ProjectStatus.Closed || project.status === ProjectStatus.Cancelled

  const isClient = user && project.clientId === Number(user.id)
  const isExpert = user && project.expertId === Number(user.id)

  const steps = [
    { label: "Khởi tạo", description: "Dự án vừa tạo", status: ProjectStatus.Created },
    { label: "Thực hiện", description: "Expert đang làm", status: ProjectStatus.InProgress },
    { label: "Nộp bài", description: "Đã giao sản phẩm", status: ProjectStatus.Delivered },
    { label: "Phê duyệt", description: "Client đã duyệt", status: ProjectStatus.Approved },
    { label: "Đóng", description: "Dự án kết thúc", status: ProjectStatus.Closed },
  ]

  const currentStepIndex = steps.findIndex((s) => s.status === project.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button & Dispute Trigger */}
      <div className="flex justify-between items-center">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {!isProjectEnded && (
          <div className="flex items-center gap-2">
            {isClient && (
              <Button
                onClick={handleCancelProject}
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                Dừng dự án
              </Button>
            )}
            <Button
              onClick={() => setActiveModal("openDispute")}
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
            >
              <Gavel className="h-3.5 w-3.5" />
              Khiếu nại / Tranh chấp ⚠️
            </Button>
          </div>
        )}
      </div>

      {/* Main Stats Header */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          {/* Tên dự án lấy từ nguồn gốc (tin tuyển dụng / gói dịch vụ) thay cho
              cặp "Project ID / Contract ID" cũ — id không nói lên điều gì với người dùng. */}
          <ProjectName
            jobId={project.jobId}
            serviceId={project.serviceId}
            className="text-xs text-muted-foreground font-semibold"
          />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Quản lý tiến độ dự án</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Hợp tác làm việc và phê duyệt thanh toán thông qua Escrow.</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng giá trị hợp đồng</p>
            <p className="text-lg font-bold text-primary">${project.proposedPrice} USD</p>
          </div>
        </div>
      </div>

      {/* Escrow Account Panel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Tài khoản Ký Quỹ (Escrow Account)
          </h3>
          
          <div className="flex gap-2">
            {/* Nạp đúng một lần cho cả hợp đồng — đã có tiền thì ẩn nút đi, BE cũng chặn nạp lần hai. */}
            {isClient && !isProjectEnded && project.escrowTotalBalance === 0 && (
              <Button
                onClick={() => setActiveModal("deposit")}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center gap-1"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Nạp tiền Ký Quỹ
              </Button>
            )}
            {/* Chỉ hiện khi thật sự rút được: dự án đã kết thúc VÀ có tiền đã nghiệm thu.
                Không gate ở đây thì Expert bấm vào chỉ để nhận lỗi 422 từ BE. */}
            {isExpert && isProjectEnded && project.escrowAvailableBalance > 0 && (
              <Button
                onClick={() => setActiveModal("withdraw")}
                variant="outline"
                size="sm"
                className="border-border hover:bg-secondary font-semibold flex items-center gap-1"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Rút ${project.escrowAvailableBalance}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/20 border border-border/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Tổng số dư (Total)</p>
            <p className="text-xl font-extrabold text-foreground mt-1">${project.escrowTotalBalance} USD</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground text-emerald-600">Đã nghiệm thu</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">${project.escrowAvailableBalance} USD</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground text-amber-600">Chưa nghiệm thu</p>
            <p className="text-xl font-extrabold text-amber-600 mt-1">${project.escrowLockedBalance} USD</p>
          </div>
        </div>

        {/* Lịch sử giao dịch Escrow */}
        {transactions.length > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Lịch sử giao dịch</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="text-xs bg-secondary/10 border border-border/40 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold uppercase text-[10px] rounded px-1.5 py-0.5 border ${
                        tx.type === 0 || tx.type === 2
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>
                        {ESCROW_TYPE_LABELS[tx.type] ?? `#${tx.type}`}
                      </span>
                      <span className={`font-semibold uppercase text-[9px] rounded px-1.5 py-0.5 ${ESCROW_STATUS_STYLES[tx.status] ?? "bg-secondary text-muted-foreground"}`}>
                        {ESCROW_STATUS_LABELS[tx.status] ?? `#${tx.status}`}
                      </span>
                      <span className="text-muted-foreground">{new Date(tx.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <span className="font-bold text-foreground">${tx.amount}</span>
                  </div>
                  {tx.note && <p className="text-muted-foreground pl-0.5">{tx.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* State Machine Stepper */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
          <PlayCircle className="h-5 w-5 text-primary" />
          Tiến độ dự án (Project Status)
        </h3>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 hidden md:block z-0" />
          
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isActive = idx === currentStepIndex

            return (
              <div
                key={step.status}
                className="relative z-10 flex flex-row md:flex-col items-center md:text-center gap-3 md:gap-2 flex-1 w-full"
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-md ring-4 ring-primary/20 animate-pulse"
                      : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                </div>

                <div className="text-left md:text-center">
                  <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestones Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Layers className="h-5 w-5 text-primary" />
                Mốc thanh toán (Milestones)
              </h3>
              
              {isClient && (
                <Button
                  onClick={() => setActiveModal("createMilestone")}
                  size="sm"
                  variant="outline"
                  className="border-primary/20 text-primary hover:bg-primary/5 font-semibold flex items-center gap-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Thêm Milestone
                </Button>
              )}
            </div>

            {milestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="font-semibold">Chưa thiết lập Milestone nào</p>
                <p className="text-xs mt-0.5">Client cần tạo milestone để cấp tiền cho các mốc bàn giao.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {milestones.map((m) => (
                  <div key={m.id} className="border border-border rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary/10 hover:bg-secondary/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{m.title}</h4>
                        <span className={`inline-block text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase ${
                          m.status === 3
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : m.status === 2
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                          {m.statusName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{m.description}</p>
                      <span className="text-[10px] text-muted-foreground block">Hạn chót: {formatDate(m.dueDate)}</span>

                      {/* Mốc đang chờ duyệt thì mở sẵn: Client phải xem được bài nộp
                          TRƯỚC khi bấm "Duyệt & Giải ngân". */}
                      <MilestoneDeliverables
                        milestoneId={m.id}
                        defaultOpen={m.status === 2}
                        refreshKey={deliverableRefreshKey}
                      />
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 justify-between">
                      <span className="text-sm font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded whitespace-nowrap">
                        ${m.amount}
                      </span>
                      
                      <div className="flex gap-1.5">
                        {/* Hành động của Expert: Nộp sản phẩm */}
                        {isExpert && m.status === 1 && (
                          <Button
                            onClick={() => { setSelectedMilestoneId(m.id); setActiveModal("submitDeliverable"); }}
                            size="sm"
                            className="bg-primary text-primary-foreground text-xs h-7 px-2.5"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Nộp sản phẩm
                          </Button>
                        )}

                        {/* Hành động của Client: Duyệt hoặc Yêu cầu sửa */}
                        {isClient && m.status === 2 && (
                          <>
                            <Button
                              onClick={() => { setSelectedMilestoneId(m.id); setActiveModal("requestRevision"); }}
                              variant="outline"
                              size="sm"
                              className="border-border hover:bg-secondary text-xs h-7 px-2.5"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Yêu cầu sửa
                            </Button>
                            <Button
                              onClick={() => handleApproveMilestone(m.id)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Duyệt & Giải ngân
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Contract overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Thông tin Hợp đồng
            </h3>
            
            <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              <div className="space-y-1.5">
                <span className="block">Nhà tuyển dụng (Client):</span>
                <UserBrief userId={project.clientId} suffix={isClient ? "(Bạn)" : undefined} />
              </div>
              <div className="space-y-1.5">
                <span className="block">Chuyên gia (Expert):</span>
                <UserBrief userId={project.expertId} suffix={isExpert ? "(Bạn)" : undefined} />
              </div>
              <div className="flex justify-between">
                <span>Ngày ký hợp đồng:</span>
                <strong className="text-foreground">{formatDate(project.createdAt)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section — chỉ hiện khi Project đã Closed (đúng nghiệp vụ BE: "đánh giá 2 chiều sau project") */}
      {project.status === ProjectStatus.Closed && user && (isClient || isExpert) && (
        <ReviewSection
          projectId={project.id}
          currentUserId={Number(user.id)}
          counterpartId={isClient ? project.expertId : project.clientId}
          counterpartLabel={isClient ? "Expert" : "Client"}
        />
      )}

      {/* --- ALL MODALS --- */}

      {/* 1. Deposit Modal */}
      {activeModal === "deposit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleDeposit} className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-5">
            <h3 className="font-bold text-lg text-primary flex items-center gap-1.5">
              <ArrowUpRight className="h-5 w-5" />
              Nạp tiền ký quỹ (Deposit)
            </h3>
            <p className="text-xs text-muted-foreground">
              Nạp <strong>đúng ${project.proposedPrice} USD</strong> — toàn bộ giá trị hợp đồng, nạp
              một lần duy nhất. Tiền được nền tảng giữ và chỉ chuyển dần cho Expert sau mỗi
              milestone bạn nghiệm thu.
            </p>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Số tiền nạp ($ USD)</label>
              <input
                type="number"
                required
                min={project.proposedPrice}
                max={project.proposedPrice}
                value={amountInput || ""}
                onChange={(e) => setAmountInput(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={String(project.proposedPrice)}
              />
              <button
                type="button"
                onClick={() => setAmountInput(project.proposedPrice)}
                className="mt-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Điền đúng giá hợp đồng (${project.proposedPrice})
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                {isSubmitting ? "Đang xử lý..." : "Xác nhận nạp"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Withdraw Modal */}
      {activeModal === "withdraw" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleWithdraw} className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-5">
            <h3 className="font-bold text-lg text-emerald-600 flex items-center gap-1.5">
              <ArrowDownLeft className="h-5 w-5" />
              Rút tiền khả dụng (Withdraw)
            </h3>
            <p className="text-xs text-muted-foreground">
              Rút phần đã được Client nghiệm thu về tài khoản cá nhân — chỉ khả dụng khi dự án đã
              đóng hoặc bị huỷ. Bạn có tối đa <strong>${project.escrowAvailableBalance} USD</strong>.
            </p>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Số tiền muốn rút ($ USD)</label>
              <input
                type="number"
                required
                min={1}
                max={project.escrowAvailableBalance}
                value={amountInput || ""}
                onChange={(e) => setAmountInput(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {isSubmitting ? "Đang xử lý..." : "Rút tiền"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Create Milestone Modal */}
      {activeModal === "createMilestone" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleCreateMilestone} className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-primary flex items-center gap-1.5">
              <PlusCircle className="h-5 w-5" />
              Tạo mốc thanh toán mới (Milestone)
            </h3>
            <p className="text-xs text-muted-foreground">Phân bổ tiền từ quỹ Khả dụng hiện có để đặt cọc cho mốc hoàn thành này.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Tiêu đề mốc</label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  placeholder="VD: Bàn giao giao diện Frontend cơ bản"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  required
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  placeholder="Mô tả cụ thể những gì Expert cần bàn giao để được duyệt..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Hạn chót</label>
                  <input
                    type="date"
                    required
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Số tiền ký quỹ ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={unallocatedAmount}
                    value={milestoneForm.amount || ""}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                Tạo & Ký quỹ
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Submit Deliverable Modal */}
      {activeModal === "submitDeliverable" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleSubmitDeliverable} className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-primary flex items-center gap-1.5">
              <Send className="h-5 w-5" />
              Nộp sản phẩm bàn giao (Deliverable)
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Đường dẫn sản phẩm (File / Link Github / Drive)</label>
                <input
                  type="url"
                  required
                  value={deliverableForm.fileUrl}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, fileUrl: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Ghi chú gửi kèm</label>
                <textarea
                  rows={4}
                  value={deliverableForm.note}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, note: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  placeholder="Nhập ghi chú, cách chạy ứng dụng hoặc hướng dẫn chi tiết..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                Giao bài
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Request Revision Modal */}
      {activeModal === "requestRevision" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleRequestRevision} className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-primary flex items-center gap-1.5">
              <Edit3 className="h-5 w-5" />
              Yêu cầu chỉnh sửa lại (Revision)
            </h3>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Lý do yêu cầu & Nội dung cần sửa</label>
              <textarea
                rows={4}
                required
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                placeholder="VD: Nút bấm trên header chưa responsive. Vui lòng căn chỉnh lại."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                Gửi yêu cầu sửa
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Open Dispute Modal */}
      {activeModal === "openDispute" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <form onSubmit={handleOpenDispute} className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5" />
              Mở Tranh Chấp khiếu nại (Open Dispute)
            </h3>
            <p className="text-xs text-muted-foreground">Admin sẽ vào can thiệp đóng băng Escrow và dựa trên mô tả để phán quyết phân chia tiền hoàn hoặc giải ngân.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Mô tả lý do tranh chấp</label>
                <textarea
                  rows={4}
                  required
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  placeholder="Ghi rõ lý do bạn mở tranh chấp, các mâu thuẫn không thể thống nhất..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Đường dẫn file bằng chứng (Evidence URL)</label>
                <input
                  type="url"
                  value={disputeForm.evidenceFileUrl}
                  onChange={(e) => setDisputeForm({ ...disputeForm, evidenceFileUrl: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Gửi khiếu nại
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
