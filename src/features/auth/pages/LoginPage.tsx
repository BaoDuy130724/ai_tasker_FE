import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore, mapAuthUser } from "../store"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { identityApi } from "@/shared/api/client"
import { Sparkles, ShieldCheck, Zap, MessageSquareCode, Eye, EyeOff, ArrowLeft } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải từ 6 ký tự trở lên" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const response = await identityApi.post("/auth/login", data)
      const tokenData = response.data?.data || response.data

      // BE trả AuthResultDto: { accessToken, refreshToken, accessTokenExpiresAt, user: { id, email, fullName, roles } }
      // -> user nằm LỒNG trong `user`, id là `user.id` (không phải `userId` phẳng).
      const { accessToken, refreshToken, user: authUser } = tokenData
      const user = mapAuthUser(authUser)
      setAuth(user, accessToken, refreshToken)
      navigate(user.role === "Admin" ? "/admin/kpi" : "/dashboard")
    } catch (err: any) {
      console.error(err)
      if (err.response) {
        // Server đã trả lời (401 sai mật khẩu...) -> hiển thị đúng message từ BE.
        setErrorMsg(err.response.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.")
      } else {
        // Không có response = network error (sai port, CORS, service chưa chạy...).
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
        
        <Link to="/" className="relative z-10 flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary hover:opacity-90 transition-opacity">
          <Sparkles className="h-6 w-6" />
          AI Tasker
        </Link>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Kết nối chuyên gia và khách hàng qua Trợ lý AI
          </h1>
          <p className="text-slate-400 text-lg">
            Nơi dễ dàng tìm kiếm công việc và thuê ngoài dịch vụ AI, bảo vệ quyền lợi tài chính cho cả người thuê lẫn người làm.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/5 p-2 text-primary border border-white/10">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Trợ Lý AI Tự Động</h4>
                <p className="text-sm text-slate-400">Tự động soạn mô tả công việc và gợi ý ngay những người có năng lực nhất cho bạn.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/5 p-2 text-primary border border-white/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Giữ Tiền Đảm Bảo (Ký Quỹ)</h4>
                <p className="text-sm text-slate-400">Tiền của bạn chỉ được chuyển đi sau khi sản phẩm bàn giao đạt yêu cầu.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white/5 p-2 text-primary border border-white/10">
                <MessageSquareCode className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Trò Chuyện Trực Tuyến</h4>
                <p className="text-sm text-slate-400">Nhắn tin trao đổi, gửi tài liệu và cập nhật tiến độ công việc tức thì.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 AI Tasker. Built for PRN232. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 sm:px-12 lg:px-20 bg-background">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium">
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang chủ
            </Link>
            <div className="lg:hidden flex items-center gap-2 font-bold text-2xl text-primary mb-6">
              <Sparkles className="h-6 w-6" />
              AI Tasker
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Đăng nhập tài khoản
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chào mừng bạn quay trở lại. Vui lòng nhập thông tin của bạn.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    className={`w-full rounded-lg border bg-card pl-3.5 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      errors.password ? "border-destructive focus:ring-destructive" : "border-input"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-input bg-card text-primary focus:ring-primary focus:ring-offset-background"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-muted-foreground select-none">
                Ghi nhớ đăng nhập trên thiết bị này
              </label>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
