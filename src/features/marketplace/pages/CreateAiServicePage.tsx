import React, { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { createService, getCategories } from "../api"
import type { Category } from "../types"
import { aiApi } from "@/shared/api/client"
import { Button } from "@/components/ui/button"
import { Sparkles, DollarSign, Clock, Plus, X, BrainCircuit, CheckCircle2, ArrowLeft } from "lucide-react"

const serviceSchema = z.object({
  categoryId: z.number().min(1, { message: "Vui lòng chọn danh mục phù hợp" }),
  title: z.string().min(5, { message: "Tiêu đề dịch vụ phải từ 5 ký tự trở lên" }),
  description: z.string().min(20, { message: "Mô tả dịch vụ phải chi tiết từ 20 ký tự trở lên" }),
  price: z.number().min(5, { message: "Mức giá tối thiểu của dịch vụ là $5" }),
  deliveryTimeDays: z.number().min(1, { message: "Thời gian bàn giao tối thiểu là 1 ngày" }),
  skills: z.array(z.string().min(1, { message: "Kỹ năng không được trống" })).min(1, {
    message: "Yêu cầu ít nhất 1 kỹ năng chuyên môn",
  }),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export const CreateAiServicePage: React.FC = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // AI Assistant states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [keywords, setKeywords] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: 1,
      title: "",
      description: "",
      price: 150,
      deliveryTimeDays: 5,
      skills: ["Gemini AI", "Python"],
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

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (err) {
        console.error("Lỗi fetch categories:", err)
      }
    }
    fetchCats()
  }, [])

  const handleGenerateDescription = async () => {
    if (!keywords.trim()) return
    setIsGenerating(true)
    setErrorMsg(null)
    try {
      // Gọi API AI sinh mô tả dịch vụ bằng các từ khoá
      const response = await aiApi.post("/aiservices/service-description", {
        keywords: keywords,
      })
      // BE bọc ApiResponse: payload thật nằm trong .data (chuẩn 2026-07-17)
      const data = response.data?.data
      setAiResult(data?.serviceDescription || null)
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
      setKeywords("")
    }
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await createService(values)
      alert("Đăng gói dịch vụ AI thành công!")
      navigate("/expert/services")
    } catch (err: any) {
      console.error(err)
      setErrorMsg(
        err.response?.data?.message || 
        "Đăng gói dịch vụ thất bại. Vui lòng kiểm tra lại thông tin."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight">Đăng gói Dịch Vụ AI mới</h1>
        <p className="text-muted-foreground mt-1">Đưa giải pháp AI của bạn lên Marketplace để tiếp cận hàng ngàn Client.</p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          {/* Tiêu đề & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Tiêu đề gói dịch vụ
              </label>
              <input
                type="text"
                {...register("title")}
                className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.title ? "border-destructive focus:ring-destructive" : "border-input"
                }`}
                placeholder="VD: Triển khai Chatbot hỗ trợ khách hàng bằng Gemini API"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Danh mục dịch vụ
              </label>
              <select
                {...register("categoryId", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mô tả & AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-foreground">
                Mô tả chi tiết gói dịch vụ
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
              placeholder="Mô tả cụ thể về giải pháp AI bạn cung cấp, các chức năng có sẵn, cách bàn giao và hỗ trợ sau triển khai..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Price & Delivery Days */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Giá bán trọn gói ($ USD)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.price ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="150"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Thời gian giao hàng (Ngày dự kiến)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  {...register("deliveryTimeDays", { valueAsNumber: true })}
                  className={`w-full rounded-lg border bg-background pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.deliveryTimeDays ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="5"
                />
              </div>
              {errors.deliveryTimeDays && (
                <p className="mt-1 text-xs text-destructive">{errors.deliveryTimeDays.message}</p>
              )}
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Kỹ năng/Công nghệ áp dụng
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập công nghệ (VD: LLM, OpenAI, Python)"
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
            onClick={() => navigate("/expert/services")}
            className="border-border hover:bg-secondary transition-all"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm transition-all"
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng gói dịch vụ"}
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
                AI Service Description Generator
              </div>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setIsAiModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Nhập các từ khóa dịch vụ (Keywords)
                </label>
                <textarea
                  rows={4}
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none"
                  placeholder="VD: Triển khai chatbot tư vấn bán hàng kết nối trang web, sử dụng mô hình Gemini Flash. Nhận dạng được ý định người dùng và đưa thông tin sản phẩm từ database."
                />
              </div>

              {aiResult && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Kết quả từ AI:
                  </label>
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
                  disabled={isGenerating || !keywords.trim()}
                  className="bg-primary text-primary-foreground flex items-center gap-1.5"
                >
                  {isGenerating ? "Đang xử lý..." : "Sinh mô tả bằng AI ✨"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
