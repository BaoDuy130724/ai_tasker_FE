import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
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
  getTransactionHistory
} from "../api"
import type { EscrowTransaction } from "../api"
import type { Project, Milestone } from "../types"
import { ProjectStatus } from "../types"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/utils"
import { ReviewSection } from "@/features/reviews/components/ReviewSection"
import { UserLink } from "@/shared/components/UserLink"
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
  Gavel
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
  const navigate = useNavigate()
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

  const fetchProjectDetails = async () => {
    if (!id) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getProjectById(Number(id))
      if (data) {
        setProject(data.project)
        setMilestones(data.milestones || [])
        const txs = await getTransactionHistory({ projectId: data.project.id, pageSize: 20 })
        setTransactions(txs)
      }
    } catch (err: any) {
      console.error(err)
      // BE trả 403 (Forbid, không body) khi user không phải Client/Expert của project này.
      setErrorMsg(getApiErrorMessage(err, "Không tải được thông tin chi tiết dự án."))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectDetails()
  }, [id])

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
      alert(`Đã nạp thành công $${amountInput} vào quỹ ký quỹ!`)
      setActiveModal(null)
      setAmountInput(0)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Nạp tiền thất bại."))
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
      alert(`Đã yêu cầu rút $${amountInput} thành công!`)
      setActiveModal(null)
      setAmountInput(0)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Rút tiền thất bại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    
    if (milestoneForm.amount > project.escrowAvailableBalance) {
      alert("Số dư khả dụng trong Escrow không đủ để cấp cho Milestone này. Vui lòng nạp thêm tiền ký quỹ.")
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
      alert("Tạo Milestone mới thành công!")
      setActiveModal(null)
      setMilestoneForm({ title: "", description: "", dueDate: "", amount: 0 })
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Tạo Milestone thất bại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveMilestone = async (milestoneId: number) => {
    if (!window.confirm("Bạn xác nhận duyệt milestone này? Tiền tương ứng từ Locked Balance sẽ được giải ngân (Release) ngay lập tức.")) return
    try {
      await approveMilestone(milestoneId)
      alert("Đã duyệt Milestone và giải ngân tiền cho Expert!")
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Duyệt Milestone thất bại."))
    }
  }

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMilestoneId === null || !revisionReason.trim()) return
    setIsSubmitting(true)
    try {
      await requestRevision(selectedMilestoneId, revisionReason)
      alert("Đã yêu cầu Expert sửa đổi sản phẩm.")
      setActiveModal(null)
      setRevisionReason("")
      setSelectedMilestoneId(null)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Yêu cầu sửa đổi thất bại."))
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
      alert("Nộp bài/Sản phẩm thành công! Đang chờ Client xét duyệt.")
      setActiveModal(null)
      setDeliverableForm({ fileUrl: "", note: "" })
      setSelectedMilestoneId(null)
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Nộp bài thất bại."))
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
      alert("Đã mở Tranh Chấp thành công. Admin hệ thống sẽ liên hệ và xem xét bằng chứng.")
      setActiveModal(null)
      setDisputeForm({ description: "", evidenceFileUrl: "" })
      await fetchProjectDetails()
    } catch (err: any) {
      console.error(err)
      alert(getApiErrorMessage(err, "Mở tranh chấp thất bại."))
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
        <Link to="/" className="text-primary hover:underline text-sm font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
      </div>
    )
  }

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
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {project.status !== ProjectStatus.Closed && (
          <Button
            onClick={() => setActiveModal("openDispute")}
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
          >
            <Gavel className="h-3.5 w-3.5" />
            Khiếu nại / Tranh chấp ⚠️
          </Button>
        )}
      </div>

      {/* Main Stats Header */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Project ID: #{project.id}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-semibold">Contract ID: #{project.contractId}</span>
          </div>
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
            {isClient && (
              <Button
                onClick={() => setActiveModal("deposit")}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center gap-1"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Nạp tiền Ký Quỹ
              </Button>
            )}
            {isExpert && (
              <Button
                onClick={() => setActiveModal("withdraw")}
                variant="outline"
                size="sm"
                className="border-border hover:bg-secondary font-semibold flex items-center gap-1"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Rút tiền khả dụng
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
            <p className="text-xs text-muted-foreground text-emerald-600">Khả dụng (Available)</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">${project.escrowAvailableBalance} USD</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground text-amber-600">Đang khóa (Locked)</p>
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
              <div className="flex justify-between">
                <span>Mã số Hợp đồng:</span>
                <strong className="text-foreground">#{project.contractId}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Nhà tuyển dụng (Client):</span>
                <strong className="text-foreground"><UserLink userId={project.clientId} /> {isClient && "(Bạn)"}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Chuyên gia (Expert):</span>
                <strong className="text-foreground"><UserLink userId={project.expertId} /> {isExpert && "(Bạn)"}</strong>
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
            <p className="text-xs text-muted-foreground">Tiền nạp vào sẽ được lưu tại số dư Khả dụng (Available Balance) để Client phân bổ vào các Milestone.</p>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Số tiền nạp ($ USD)</label>
              <input
                type="number"
                required
                min={1}
                value={amountInput || ""}
                onChange={(e) => setAmountInput(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="500"
              />
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
            <p className="text-xs text-muted-foreground">Rút số dư Khả dụng về tài khoản cá nhân. Bạn có tối đa <strong>${project.escrowAvailableBalance} USD</strong> khả dụng để rút.</p>
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
                    max={project.escrowAvailableBalance}
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
