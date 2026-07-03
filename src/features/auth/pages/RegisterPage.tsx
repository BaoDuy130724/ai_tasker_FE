import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { identityApi } from "@/shared/api/client"
import { Sparkles, ShieldCheck, Zap, MessageSquareCode, User, Briefcase } from "lucide-react"

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Họ tên phải từ 2 ký tự trở lên" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải từ 6 ký tự trở lên" }),
  role: z.enum(["Client", "Expert", "Admin"]),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "Client",
    },
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await identityApi.post("/auth/register", data)
      setSuccessMsg("Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...")
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err: any) {
      console.error(err)
      if (err.response) {
        // Server đã trả lời (409 email trùng, 400 validate...) -> hiển thị đúng message từ BE.
        setErrorMsg(err.response.data?.message || "Đăng ký thất bại. Vui lòng thử lại.")
      } else {
        // Không có response = network error (sai port, CORS, service chưa chạy...) -> KHÔNG được
        // đoán là "email đã tồn tại", dễ làm sai lệch hướng debug.
        setErrorMsg("Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: Premium Branding Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Glow effect */}
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary">
          <Sparkles className="h-6 w-6" />
          AI Tasker
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Gia nhập cộng đồng Freelance thế hệ mới
          </h1>
          <p className="text-slate-400 text-lg">
            Khởi động hành trình của bạn ngay hôm nay. Cho dù bạn muốn thuê chuyên gia hay cung cấp dịch vụ AI, chúng tôi đều có giải pháp.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/5 p-2 text-primary border border-white/10">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">AI Trợ Lý Thông Minh</h4>
                <p className="text-sm text-slate-400">Tự động sinh mô tả công việc, đề xuất expert tối ưu nhất.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/5 p-2 text-primary border border-white/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Ký Quỹ Escrow An Toàn</h4>
                <p className="text-sm text-slate-400">Đảm bảo dòng tiền minh bạch, thanh toán theo từng milestone được duyệt.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/5 p-2 text-primary border border-white/10">
                <MessageSquareCode className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Chat Realtime & SignalR</h4>
                <p className="text-sm text-slate-400">Trao đổi trực tiếp, đính kèm tài liệu với tốc độ tức thì.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 AI Tasker. Built for PRN232. All rights reserved.
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 sm:px-12 lg:px-20 bg-background">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-primary mb-6">
              <Sparkles className="h-6 w-6" />
              AI Tasker
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bắt đầu trải nghiệm các tính năng hàng đầu của AI Tasker.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-foreground mb-1.5">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register("fullName")}
                  className={`w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.fullName ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={`w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.email ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.password ? "border-destructive focus:ring-destructive" : "border-input"
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2.5">
                  Tôi muốn tham gia với vai trò:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("role", "Client")}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden ${
                      selectedRole === "Client"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                        : "border-input bg-card hover:bg-muted"
                    }`}
                  >
                    <User className="h-4 w-4 mb-1.5" />
                    <span className="text-xs font-bold">Khách hàng</span>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-tight">Tôi muốn đăng tuyển thuê Expert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("role", "Expert")}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden ${
                      selectedRole === "Expert"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                        : "border-input bg-card hover:bg-muted"
                    }`}
                  >
                    <Briefcase className="h-4 w-4 mb-1.5" />
                    <span className="text-xs font-bold">Expert Freelance</span>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-tight">Tôi muốn tìm việc và bán dịch vụ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("role", "Admin")}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden ${
                      selectedRole === "Admin"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                        : "border-input bg-card hover:bg-muted"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 mb-1.5 text-primary" />
                    <span className="text-xs font-bold">Admin Portal</span>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-tight">Quản trị và kiểm duyệt hệ thống</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? "Đang xử lý..." : "Đăng ký tài khoản"}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
