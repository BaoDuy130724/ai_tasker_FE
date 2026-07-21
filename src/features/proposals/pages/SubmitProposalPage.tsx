import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useSafeBack } from "@/shared/hooks/useSafeBack"
import { useToast } from "@/shared/ui/use-toast"
import { getJobById } from "@/features/jobs/api"
import type { Job } from "@/features/jobs/types"
import { submitProposal } from "../api"
import { Button } from "@/components/ui/button"
import { DollarSign, Calendar, Clock, Sparkles, ArrowLeft, ShieldAlert } from "lucide-react"

const proposalSchema = z.object({
  proposedPrice: z.number().min(5, { message: "Giá đề xuất tối thiểu là $5" }),
  estimatedDays: z.number().min(1, { message: "Thời gian thực hiện tối thiểu là 1 ngày" }),
  description: z.string().min(10, { message: "Mô tả đề xuất phải chi tiết từ 10 ký tự" }),
})

type ProposalFormValues = z.infer<typeof proposalSchema>

export const SubmitProposalPage: React.FC = () => {
  const navigate = useNavigate()
  const goBack = useSafeBack()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const jobIdStr = searchParams.get("jobId")
  const jobId = jobIdStr ? Number(jobIdStr) : null

  const [job, setJob] = useState<Job | null>(null)
  const [isJobLoading, setIsJobLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      proposedPrice: 100,
      estimatedDays: 7,
      description: "",
    },
  })

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setErrorMsg("Không tìm thấy mã công việc hợp lệ.")
        setIsJobLoading(false)
        return
      }
      try {
        const data = await getJobById(jobId)
        setJob(data)
      } catch (err) {
        console.error(err)
        setErrorMsg("Lỗi tải thông tin công việc tuyển dụng.")
      } finally {
        setIsJobLoading(false)
      }
    }
    fetchJob()
  }, [jobId])

  const onSubmit = async (values: ProposalFormValues) => {
    if (!jobId) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await submitProposal({
        jobId,
        ...values,
      })
      toast.success("Nộp đề xuất ứng tuyển thành công!")
      // Về danh sách proposal của mình để theo dõi trạng thái.
      navigate("/expert/proposals", { replace: true })
    } catch (err: any) {
      console.error(err)
      setErrorMsg(
        err.response?.data?.message || 
        "Gửi đề xuất thất bại. Bạn có thể đã nộp đề xuất cho job này rồi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isJobLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-20 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  if (errorMsg || !job) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Không tìm thấy Job</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || "Mã công việc không chính xác."}</p>
        <Button onClick={goBack} variant="outline" className="flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Job Info Summary */}
      <div className="lg:col-span-1 space-y-6">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Job
        </button>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-base border-b border-border pb-3">Công việc ứng tuyển</h3>
          
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-primary">{job.title}</h4>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Ngân sách dự kiến: <strong>${job.budget}</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Hạn chót: {new Date(job.deadline).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40 mt-2">
              {job.skills.map((s) => (
                <span key={s} className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground border border-border">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Proposal Form */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Nộp Đề Xuất Ứng Tuyển</h1>
          <p className="text-muted-foreground mt-1">Đề xuất mức phí, thời gian và cách bạn sẽ triển khai công việc này.</p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Giá đề xuất */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Giá đề xuất của bạn ($ USD)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  {...register("proposedPrice", { valueAsNumber: true })}
                  className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.proposedPrice ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="100"
                />
              </div>
              {errors.proposedPrice && (
                <p className="mt-1 text-xs text-destructive">{errors.proposedPrice.message}</p>
              )}
            </div>

            {/* Thời gian thực hiện */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Thời gian thực hiện ước tính (Ngày)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  {...register("estimatedDays", { valueAsNumber: true })}
                  className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.estimatedDays ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="7"
                />
              </div>
              {errors.estimatedDays && (
                <p className="mt-1 text-xs text-destructive">{errors.estimatedDays.message}</p>
              )}
            </div>
          </div>

          {/* Mô tả giải pháp */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Chi tiết đề xuất & Giải pháp của bạn
            </label>
            <textarea
              rows={6}
              {...register("description")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all leading-relaxed ${
                errors.description ? "border-destructive focus:ring-destructive" : "border-input"
              }`}
              placeholder="Giới thiệu bản thân, các dự án tương tự bạn đã làm và kế hoạch triển khai công việc này của bạn..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="border-border hover:bg-secondary transition-all"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? "Đang gửi..." : "Gửi đề xuất"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
