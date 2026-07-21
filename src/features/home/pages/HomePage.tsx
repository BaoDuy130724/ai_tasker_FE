import React from "react"
import { Link } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { Sparkles, ShieldCheck, Zap, MessageSquareCode, ArrowRight, Star, StarHalf, CheckCircle } from "lucide-react"

export const HomePage: React.FC = () => {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-primary">
            <Sparkles className="h-6 w-6" />
            AI Tasker
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Tính năng</a>
            <a href="#workflow" className="hover:text-primary transition-colors">Quy trình</a>
            <a href="#security" className="hover:text-primary transition-colors">Bảo mật</a>
            <a href="#about" className="hover:text-primary transition-colors">Về chúng tôi</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-105"
              >
                Vào Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow hover:bg-slate-800 transition-all hover:scale-105"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          {/* Radial glow background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Nền Tảng Đột Phá Cho Freelancer & Doanh Nghiệp
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-slate-900">
              Platform Freelance Thế Hệ Mới <br className="hidden md:inline" />
              Tích Hợp <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Trí Tuệ Nhân Tạo AI</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed">
              AI Tasker kết nối các khách hàng thông thái với mạng lưới chuyên gia AI tài năng toàn cầu. 
              Mọi giao dịch được đảm bảo ký quỹ escrow an toàn tuyệt đối.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/95 transition-all hover:scale-105"
                >
                  Truy cập Dashboard của bạn
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/95 transition-all hover:scale-105"
                  >
                    Bắt đầu miễn phí
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <a
                    href="#features"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 hover:bg-slate-200 px-8 py-3.5 text-base font-bold text-slate-800 transition-all"
                  >
                    Tìm hiểu tính năng
                  </a>
                </>
              )}
            </div>
            
            {/* Trust badge */}
            <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <StarHalf className="h-4 w-4 fill-amber-500" />
                <span className="ml-2 text-slate-600 font-semibold">4.9/5 xếp hạng chất lượng</span>
              </div>
              <span className="hidden md:inline text-slate-300">•</span>
              <p>Hơn 500+ dự án công nghệ AI đã hoàn thành</p>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-20 bg-white border-t border-slate-100 relative">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Tính Năng Nổi Bật Chỉ Có Tại AI Tasker</h2>
              <p className="text-slate-500 text-sm md:text-base">
                Tối ưu hóa năng suất lao động bằng cách áp dụng tối đa các công nghệ hiện đại bậc nhất.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 hover:border-primary/20 hover:bg-slate-50 hover:shadow-md transition-all group">
                <div className="rounded-xl bg-primary/10 p-3.5 text-primary w-fit group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-6">Tạo Job Thông Minh Bằng AI</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Chỉ cần nhập ý tưởng sơ lược, AI tích hợp (Gemini API) sẽ hỗ trợ sinh mô tả công việc, đề xuất milestones và ước lượng chi phí phù hợp nhất cho bạn.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 hover:border-primary/20 hover:bg-slate-50 hover:shadow-md transition-all group">
                <div className="rounded-xl bg-violet-500/10 p-3.5 text-violet-600 w-fit group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-6">Ký Quỹ Escrow Tuyệt Đối</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Ngân sách dự án được ký quỹ an toàn và giải ngân từng phần (Milestones). Expert hoàn toàn yên tâm được trả tiền, Client hoàn toàn an tâm nhận sản phẩm chất lượng.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-8 hover:border-primary/20 hover:bg-slate-50 hover:shadow-md transition-all group">
                <div className="rounded-xl bg-indigo-500/10 p-3.5 text-indigo-600 w-fit group-hover:scale-110 transition-transform">
                  <MessageSquareCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-6">SignalR Chat & Realtime</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Hệ thống tin nhắn tức thời và thông báo thời gian thực hỗ trợ trao đổi công việc, bàn giao demo chất lượng cao, tăng cường tương tác tức thì 24/7.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Quy Trình Hoạt Động Liền Mạch</h2>
              <p className="text-slate-500 text-sm md:text-base">
                Tạo lập hợp đồng, ký quỹ và làm việc dễ dàng qua 4 bước tiêu chuẩn.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-4 relative">
              {/* Step 1 */}
              <div className="space-y-4 relative">
                <div className="text-5xl font-extrabold text-slate-200">01</div>
                <h4 className="text-lg font-bold text-slate-900">Đăng Tuyển Job & AI Assist</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Client đăng yêu cầu tuyển dụng. Hệ thống sử dụng AI để chuẩn hóa mô tả kỹ năng và đưa ra các đề xuất chuyên gia phù hợp nhất.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-4 relative">
                <div className="text-5xl font-extrabold text-slate-200">02</div>
                <h4 className="text-lg font-bold text-slate-900">Báo Giá & Phê Duyệt</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Các Expert nộp Proposal kèm mức giá dự kiến. Client phê duyệt để tạo ra Hợp đồng (Contract) và kích hoạt dự án (Project).
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-4 relative">
                <div className="text-5xl font-extrabold text-slate-200">03</div>
                <h4 className="text-lg font-bold text-slate-900">Ký Quỹ & Thực Hiện</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Tiền được chuyển vào tài khoản ký quỹ. Expert bắt đầu thực hiện công việc và nộp báo cáo bàn giao cho từng cột mốc công việc (Milestone).
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-4 relative">
                <div className="text-5xl font-extrabold text-slate-200">04</div>
                <h4 className="text-lg font-bold text-slate-900">Nghiệm Thu & Rút Tiền</h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Client duyệt báo cáo bàn giao, tiền ký quỹ sẽ được giải ngân vào tài khoản khả dụng của Expert để thực hiện rút tiền về ví.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Escrow Highlight */}
        <section id="security" className="py-20 bg-white border-t border-slate-100 relative overflow-hidden">
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 grid gap-12 md:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-bold text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                Hệ Thống Escrow Chuẩn Quốc Tế
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Không Còn Nỗi Lo <br />
                Bùng Tiền Hay Nợ Lương
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Chúng tôi giải quyết triệt để vấn đề mất niềm tin giữa Freelancer và Khách hàng. 
                Toàn bộ ngân sách dự án được quản lý tự động thông qua tài khoản Ký quỹ (Escrow Account). 
                Khi có mâu thuẫn, ban quản trị hỗ trợ giải quyết qua cổng Tranh chấp (Dispute Portal) đảm bảo công bằng tối đa.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Ký quỹ an toàn 100%
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Giải quyết tranh chấp công bằng
                </div>
              </div>
            </div>

            <div className="border border-slate-200 bg-slate-50/50 p-8 rounded-2xl space-y-6 shadow-md relative">
              <h4 className="font-bold text-lg text-slate-900 border-b border-slate-200 pb-3">Chi tiết Giao dịch Escrow mẫu</h4>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium">Tổng ngân sách hợp đồng:</span>
                  <span className="font-bold text-slate-900">$1,500.00</span>
                </div>
                
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium">Số dư tạm khóa (Locked):</span>
                  <span className="font-bold text-amber-600">$1,000.00</span>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium">Số dư khả dụng (Available):</span>
                  <span className="font-bold text-emerald-600">$500.00</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Số dư tạm khóa sẽ ngay lập tức được giải phóng chuyển thành khả dụng cho Expert khi mốc công việc (Milestone) tương ứng được Client duyệt nghiệm thu thành công.</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Callout */}
        <section className="py-20 border-t border-slate-100 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Bắt Đầu Trải Nghiệm AI Tasker Hôm Nay</h2>
            <p className="text-slate-600 text-base max-w-xl mx-auto">
              Tham gia ngay để nhận hỗ trợ từ Trợ lý AI và trải nghiệm hệ thống làm việc Freelance bảo mật hàng đầu.
            </p>
            <div>
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/95 transition-all hover:scale-105"
                >
                  Truy cập Dashboard của bạn
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/95 transition-all hover:scale-105"
                >
                  Đăng ký tài khoản ngay
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="border-t border-slate-200/80 bg-white py-12 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-slate-900 text-base">AI Tasker</span>
          </div>

          <p className="text-center md:text-left text-xs text-slate-500">
            © 2026 AI Tasker. Phát triển cho môn học PRN232 - ASP.NET Web API & Microservices.
          </p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-primary transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-primary transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
