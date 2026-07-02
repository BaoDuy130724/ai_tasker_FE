import React, { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { createJob } from "../api"
import { aiApi } from "@/shared/api/client"
import { Button } from "@/components/ui/button"
import { Sparkles, Calendar, DollarSign, Plus, X, BrainCircuit, CheckCircle2 } from "lucide-react"

const jobSchema = z.object({
  title: z.string().min(5, { message: "Tiêu đề phải từ 5 ký tự trở lên" }),
  description: z.string().min(20, { message: "Mô tả công việc phải chi tiết từ 20 ký tự trở lên" }),
  budget: z.number().min(5, { message: "Ngân sách tối thiểu là $5" }),
  deadline: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Hạn chót phải là một ngày trong tương lai",
  }),
  skills: z.array(z.string().min(1, { message: "Tên kỹ năng không được để trống" })).min(1, {
    message: "Yêu cầu ít nhất 1 kỹ năng",
  }),
})

type JobFormValues = z.infer<typeof jobSchema>

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State cho AI Helper
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [roughReqs, setRoughReqs] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [isFromFallback, setIsFromFallback] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 100,
      deadline: "",
      skills: ["React", "Node.js"],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills" as never,
  })

  const [newSkill, setNewSkill] = useState("")

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      append(newSkill.trim() as never)
      setNewSkill("")
    }
  }

  const handleGenerateDescription = async () => {
    if (!roughReqs.trim()) return
    setIsGenerating(true)
    setErrorMsg(null)
    try {
      // Gọi API AI sinh mô tả job qua proxy
      const response = await aiApi.post("/aiservices/job-description", {
        roughRequirements: roughReqs,
      })
      const data = response.data
      setAiResult(data.jobDescription || data)
      setIsFromFallback(data.isFromFallback || false)
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Không thể kết nối đến dịch vụ AI. Hãy nhập mô tả thủ công hoặc thử lại sau.")
    } finally {
      setIsGenerating(false)
    }
  }

  const applyAiDescription = () => {
    if (aiResult) {
      setValue("description", aiResult)
      setIsAiModalOpen(false)
      setAiResult(null)
      setRoughReqs("")
    }
  }

  const onSubmit = async (values: JobFormValues) => {
    if (!user) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const clientId = Number(user.id)
      await createJob({
        ...values,
        clientId,
      })
      navigate("/")
    } catch (err: any) {
      console.error(err)
      setErrorMsg(
        err.response?.data?.message || 
        "Đăng tin tuyển dụng thất bại. Vui lòng kiểm tra lại thông tin."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Đăng Job tuyển dụng mới</h1>
        <p className="text-muted-foreground mt-1">AI Trợ lý của chúng tôi sẽ giúp bạn tối ưu hóa tin đăng tuyển để tìm Expert phù hợp nhất.</p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Tiêu đề công việc
            </label>
            <input
              type="text"
              {...register("title")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                errors.title ? "border-destructive focus:ring-destructive" : "border-input"
              }`}
              placeholder="VD: Xây dựng Dashboard Quản Lý Tài Chính bằng React & Tailwind"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Mô tả & AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-foreground">
                Mô tả chi tiết yêu cầu công việc
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-primary font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary-foreground hover:bg-primary transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Viết bằng AI ✨
              </Button>
            </div>
            <textarea
              rows={8}
              {...register("description")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all leading-relaxed ${
                errors.description ? "border-destructive focus:ring-destructive" : "border-input"
              }`}
              placeholder="Mô tả cụ thể về mục tiêu dự án, các mốc tiến độ (milestones), chức năng chính cần làm và yêu cầu kỹ thuật..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Budget & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Ngân sách dự kiến ($ USD)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  {...register("budget", { valueAsNumber: true })}
                  className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.budget ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="500"
                />
              </div>
              {errors.budget && (
                <p className="mt-1 text-xs text-destructive">{errors.budget.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Hạn chót hoàn thành (Deadline)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="date"
                  {...register("deadline")}
                  className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.deadline ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                />
              </div>
              {errors.deadline && (
                <p className="mt-1 text-xs text-destructive">{errors.deadline.message}</p>
              )}
            </div>
          </div>

          {/* Tag Skills */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Yêu cầu kỹ năng
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập kỹ năng (VD: Tailwind CSS)"
              />
              <Button type="button" variant="outline" onClick={handleAddSkill} className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Thêm
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {fields.map((field: any, index) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold border border-primary/20"
                >
                  <input type="hidden" {...register(`skills.${index}`)} />
                  {field.value || field}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-primary hover:text-primary/70 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.skills && (
              <p className="mt-1 text-xs text-destructive">{errors.skills.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="border-border hover:bg-secondary transition-all"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm transition-all"
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng Job"}
          </Button>
        </div>
      </form>

      {/* AI Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAiModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-lg text-primary">
                <BrainCircuit className="h-5 w-5" />
                AI Generator Description
              </div>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setIsAiModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Nhập yêu cầu sơ bộ của bạn (Rough Requirements)
                </label>
                <textarea
                  rows={4}
                  value={roughReqs}
                  onChange={(e) => setRoughReqs(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="VD: Cần làm app bán hàng bằng React Native kết nối API Net 8. Có các chức năng đăng nhập, giỏ hàng, thanh toán qua ngân hàng, lịch sử đơn hàng."
                />
              </div>

              {aiResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-foreground">
                      Kết quả từ AI:
                    </label>
                    {isFromFallback && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                        Fallback mode
                      </span>
                    )}
                  </div>
                  <div className="w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-secondary/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {aiResult}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setIsAiModalOpen(false)} className="border-border">
                Đóng
              </Button>
              {aiResult ? (
                <Button onClick={applyAiDescription} className="bg-primary text-primary-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Sử dụng mô tả này
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !roughReqs.trim()}
                  className="bg-primary text-primary-foreground flex items-center gap-1.5"
                >
                  {isGenerating ? "Đang xử lý AI..." : "Sinh mô tả bằng AI ✨"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
