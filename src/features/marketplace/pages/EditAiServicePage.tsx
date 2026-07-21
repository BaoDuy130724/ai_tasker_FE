import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { useSafeBack } from "@/shared/hooks/useSafeBack"
import { useToast } from "@/shared/ui/toast"
import { getServiceById, updateService, getCategories } from "../api"
import type { Category } from "../types"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, Plus, X, ArrowLeft } from "lucide-react"

const serviceSchema = z.object({
  categoryId: z.number().min(1, { message: "Vui lòng chọn danh mục phù hợp" }),
  title: z.string().min(5, { message: "Tiêu đề dịch vụ phải từ 5 ký tự trở lên" }),
  description: z.string().min(20, { message: "Mô tả dịch vụ phải chi tiết từ 20 ký tự trở lên" }),
  price: z.number().min(5, { message: "Mức giá tối thiểu của dịch vụ là $5" }),
  deliveryTimeDays: z.number().min(1, { message: "Thời gian bàn giao tối thiểu là 1 ngày" }),
  status: z.enum(["Draft", "Published", "Archived"]),
  skills: z.array(z.string().min(1, { message: "Kỹ năng không được trống" })).min(1, {
    message: "Yêu cầu ít nhất 1 kỹ năng chuyên môn",
  }),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export const EditAiServicePage: React.FC = () => {
  const navigate = useNavigate()
  const goBack = useSafeBack()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const [categories, setCategories] = useState<Category[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      categoryId: 1,
      title: "",
      description: "",
      price: 0,
      deliveryTimeDays: 1,
      status: "Draft",
      skills: [],
    },
  })

  // skills là mảng string primitive -> KHÔNG dùng useFieldArray (nó chỉ hỗ trợ mảng object).
  const skills = watch("skills") ?? []

  const [newSkill, setNewSkill] = useState("")

  const handleAddSkill = () => {
    const value = newSkill.trim()
    if (!value) return
    if (skills.includes(value)) {
      setNewSkill("")
      return
    }
    setValue("skills", [...skills, value], { shouldValidate: true })
    setNewSkill("")
  }

  const handleRemoveSkill = (index: number) => {
    setValue(
      "skills",
      skills.filter((_, i) => i !== index),
      { shouldValidate: true }
    )
  }

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setIsLoading(true)
      try {
        const [service, cats] = await Promise.all([getServiceById(Number(id)), getCategories()])
        setCategories(cats)
        if (service) {
          setCoverImageUrl(service.coverImageUrl)
          reset({
            categoryId: service.categoryId,
            title: service.title,
            description: service.description,
            price: service.price,
            deliveryTimeDays: service.deliveryTimeDays,
            status: (service.status as ServiceFormValues["status"]) || "Draft",
            skills: service.skills || [],
          })
        } else {
          setErrorMsg("Không tìm thấy gói dịch vụ này.")
        }
      } catch (err) {
        console.error("Lỗi tải dịch vụ:", err)
        setErrorMsg("Không tải được thông tin gói dịch vụ.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, reset])

  const onSubmit = async (values: ServiceFormValues) => {
    if (!id) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await updateService(Number(id), { ...values, coverImageUrl })
      toast.success("Cập nhật gói dịch vụ thành công!")
      navigate("/expert/services")
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || "Cập nhật gói dịch vụ thất bại. Vui lòng kiểm tra lại thông tin.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-1/3 bg-muted rounded" />
        <div className="h-64 w-full bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-transparent border-0 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight">Sửa gói Dịch Vụ AI</h1>
        <p className="text-muted-foreground mt-1">Cập nhật thông tin, giá và trạng thái hiển thị của gói dịch vụ.</p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Tiêu đề gói dịch vụ</label>
              <input
                type="text"
                {...register("title")}
                className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.title ? "border-destructive focus:ring-destructive" : "border-input"
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Danh mục dịch vụ</label>
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

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mô tả chi tiết gói dịch vụ</label>
            <textarea
              rows={8}
              {...register("description")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all leading-relaxed ${
                errors.description ? "border-destructive focus:ring-destructive" : "border-input"
              }`}
            />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Giá bán trọn gói ($ USD)</label>
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
                />
              </div>
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Thời gian giao hàng (Ngày)</label>
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
                />
              </div>
              {errors.deliveryTimeDays && <p className="mt-1 text-xs text-destructive">{errors.deliveryTimeDays.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Trạng thái hiển thị</label>
              <select
                {...register("status")}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="Draft">Draft (bản nháp)</option>
                <option value="Published">Published (đang bán)</option>
                <option value="Archived">Archived (đã ẩn)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Kỹ năng/Công nghệ áp dụng</label>
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
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold border border-primary/20"
                >
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(index)} className="text-primary hover:text-primary/70 focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {errors.skills && <p className="mt-1 text-xs text-destructive">{(errors.skills as any).message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate("/expert/services")} className="border-border hover:bg-secondary transition-all">
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm transition-all">
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  )
}
