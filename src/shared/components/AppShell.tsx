import React, { useState, useEffect } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { useNotificationStore } from "@/features/notifications/store"
import { AiAssistantSidebar } from "./AiAssistantSidebar"
import { Button } from "@/components/ui/button"
import { identityApi } from "@/shared/api/client"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Search,
  Sparkles,
  Layers,
  Star,
  ShoppingBag,
  BrainCircuit,
  Heart,
  Scale,
  Sun,
  Moon,
} from "lucide-react"

export const AppShell: React.FC = () => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme")
      if (stored === "dark" || stored === "light") return stored
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"))
  }

  const { accessToken } = useAuthStore()
  const { startSignalR, stopSignalR, fetchNotifications, unreadCount } = useNotificationStore()

  useEffect(() => {
    if (accessToken) {
      startSignalR(accessToken)
      fetchNotifications()
      
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission()
        }
      }
    }
    return () => {
      stopSignalR()
    }
  }, [accessToken, startSignalR, stopSignalR, fetchNotifications])

  const handleLogout = async () => {
    try {
      // Best-effort: thu hồi refresh token phía BE. Nếu lỗi (mạng, token hết hạn...)
      // vẫn cho đăng xuất bình thường ở FE, không chặn user.
      await identityApi.post("/auth/logout")
    } catch (err) {
      console.error("Lỗi gọi logout BE (bỏ qua, vẫn đăng xuất ở FE):", err)
    }
    clearAuth()
    navigate("/login")
  }

  // Định nghĩa menu links theo role
  const getNavigationLinks = () => {
    if (!user) return []

    const commonLinks = [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/messages", label: "Tin nhắn", icon: MessageSquare },
    ]

    switch (user.role) {
      case "Client":
        return [
          ...commonLinks,
          { to: "/client/jobs", label: "Quản lý Job", icon: Briefcase },
          { to: "/client/projects", label: "Dự án & Hợp đồng", icon: FileText },
          { to: "/marketplace", label: "Marketplace AI", icon: Search },
          { to: "/favorites", label: "Dịch vụ đã lưu", icon: Heart },
          { to: "/client/orders", label: "Đơn mua dịch vụ", icon: ShoppingBag },
        ]
      case "Expert":
        return [
          ...commonLinks,
          { to: "/jobs", label: "Tìm việc làm", icon: Search },
          { to: "/expert/proposals", label: "Proposals của tôi", icon: FileText },
          { to: "/expert/projects", label: "Dự án nhận làm", icon: Layers },
          { to: "/expert/services", label: "Dịch vụ của tôi", icon: Briefcase },
          { to: "/favorites", label: "Dịch vụ đã lưu", icon: Heart },
          { to: "/expert/orders", label: "Đơn đặt hàng", icon: ShoppingBag },
        ]
      case "Admin":
        return [
          ...commonLinks,
          { to: "/admin/kpi", label: "Dashboard KPI", icon: Shield },
          { to: "/admin/users", label: "Quản lý Users", icon: User },
          { to: "/admin/jobs", label: "Quản lý Job", icon: Briefcase },
          { to: "/admin/services", label: "Quản lý Dịch vụ", icon: Layers },
          { to: "/admin/certificates", label: "Duyệt Chứng chỉ", icon: Star },
          { to: "/admin/disputes", label: "Xử lý Tranh chấp", icon: Scale },
        ]
      default:
        return commonLinks
    }
  }

  const links = getNavigationLinks()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Sparkles className="h-6 w-6" />
            AI Tasker
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-secondary/50 mb-4">
            <Link to="/profile/me" className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
              </div>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="font-semibold text-lg text-foreground md:block hidden">
              Chào mừng quay trở lại, {user?.fullName}!
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background relative">
            <Outlet />
            
            {/* Floating AI Assistant Bubble */}
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-50 border ${
                isAiOpen 
                  ? "bg-secondary text-foreground border-border hover:bg-secondary/90" 
                  : "bg-primary text-primary-foreground border-primary/20 hover:bg-primary/95"
              }`}
            >
              {isAiOpen ? <X className="h-6 w-6" /> : <BrainCircuit className="h-6 w-6" />}
            </button>
          </main>

          {isAiOpen && (
            <AiAssistantSidebar onClose={() => setIsAiOpen(false)} />
          )}
        </div>
      </div>

      {/* Mobile Menu Backdrop & Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="relative flex w-full max-w-xs flex-col bg-card h-full p-6 shadow-xl transition-transform duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-border">
              <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                <Sparkles className="h-6 w-6" />
                AI Tasker
              </Link>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 py-6 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-secondary/50 mb-4">
                <Link to="/profile/me" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </Link>
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
