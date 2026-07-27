import React, { useState, useEffect } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { useNotificationStore } from "@/features/notifications/store"
import { AiAssistantSidebar } from "./AiAssistantSidebar"
import { ChatBubble } from "@/features/messaging/components/ChatBubble"
import { ErrorBoundary } from "./ErrorBoundary"
import { Breadcrumbs } from "./Breadcrumbs"
import { PageTitleProvider } from "./PageTitleContext"
import { usePageTitleValue } from "@/shared/hooks/usePageTitle"
import { Button } from "@/components/ui/button"
import { useDraggable } from "@/shared/hooks/useDraggable"
import { identityApi } from "@/shared/api/client"
import {
  buildBreadcrumbs,
  getNavSections,
  resolveActiveNavKey,
  type NavSection,
} from "@/app/navigation"
import {
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  BrainCircuit,
  Sun,
  Moon,
} from "lucide-react"

interface SidebarNavProps {
  sections: NavSection[]
  /** Path của mục đang active — đã tính cả trường hợp đang ở trang con. */
  activeKey?: string
  onNavigate?: () => void
}

const SidebarNav: React.FC<SidebarNavProps> = ({ sections, activeKey, onNavigate }) => (
  <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
    {sections.map((section) => (
      <div key={section.title} className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {section.title}
        </p>
        {section.items.map((item) => {
          const Icon = item.icon
          const isActive = activeKey === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    ))}
  </nav>
)

const AppShellContent: React.FC = () => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const aiDraggable = useDraggable()

  // Hai panel nổi cùng neo góc phải nên chỉ cho phép mở một cái tại một thời điểm,
  // tránh chúng đè lên nhau.
  const openAi = (next: boolean) => {
    setIsAiOpen(next)
    if (next) setIsChatOpen(false)
  }
  const openChat = (next: boolean) => {
    setIsChatOpen(next)
    if (next) setIsAiOpen(false)
  }

  // Trang /messages đã là giao diện chat đầy đủ. Hiện thêm bubble ở đó sẽ tạo
  // hai kết nối SignalR cùng join một session → tin nhắn xử lý hai lần.
  const showChatBubble = Boolean(user) && location.pathname !== "/messages"

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

  // Điều hướng và breadcrumb cùng đọc từ một bản đồ route duy nhất (@/app/navigation),
  // nên trang con luôn làm sáng đúng mục cha trong sidebar.
  const sections = getNavSections(user?.role)
  const activeNavKey = resolveActiveNavKey(location.pathname, user?.role)
  const pageTitle = usePageTitleValue()
  const crumbs = buildBreadcrumbs(location.pathname, user?.role, pageTitle)
  const currentLabel = crumbs[crumbs.length - 1]?.label

  useEffect(() => {
    document.title = currentLabel ? `${currentLabel} · AI Tasker` : "AI Tasker"
  }, [currentLabel])

  const isProfileActive = location.pathname === "/profile/me"
  const isNotificationsActive = location.pathname === "/notifications"

  const userCard = (onNavigate?: () => void) => (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
      <Link
        to="/profile/me"
        onClick={onNavigate}
        aria-current={isProfileActive ? "page" : undefined}
        className={`group flex cursor-pointer items-center gap-3 overflow-hidden transition-opacity hover:opacity-80 ${
          isProfileActive ? "text-primary" : ""
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary transition-colors group-hover:bg-primary/20">
          {user?.fullName?.charAt(0) || "U"}
        </div>
        <div className="overflow-hidden">
          <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
            {user?.fullName}
          </p>
          <p className="truncate text-xs capitalize text-muted-foreground">{user?.role}</p>
        </div>
      </Link>
      <button
        onClick={toggleTheme}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <Sparkles className="h-6 w-6" />
            AI Tasker
          </Link>
        </div>
        <SidebarNav sections={sections} activeKey={activeNavKey} />
        <div className="border-t border-border p-4">
          {userCard()}
          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2 border-border text-muted-foreground hover:text-foreground"
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
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="text-muted-foreground hover:text-foreground md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Breadcrumbs items={crumbs} />
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {/* Notification Bell */}
            <Link
              to="/notifications"
              aria-label="Thông báo"
              aria-current={isNotificationsActive ? "page" : undefined}
              className={`relative rounded-lg p-2 transition-all ${
                isNotificationsActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex flex-1 overflow-hidden">
          <main className="relative flex-1 overflow-y-auto bg-background p-6 md:p-8">
            {/* Lỗi render của 1 trang không được làm sập cả shell -> vẫn còn sidebar để đi chỗ khác. */}
            <ErrorBoundary scope="page" resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>

            {/* Floating Chat Bubble — thay cho mục "Tin nhắn" trong sidebar */}
            {showChatBubble && (
              <ChatBubble
                isOpen={isChatOpen}
                onToggle={() => openChat(!isChatOpen)}
                onClose={() => openChat(false)}
              />
            )}

            {/* Floating AI Assistant Bubble */}
            <button
              type="button"
              onMouseDown={aiDraggable.handleMouseDown}
              onClick={() => {
                if (aiDraggable.wasDragged()) return
                openAi(!isAiOpen)
              }}
              style={{ transform: `translate(${aiDraggable.position.x}px, ${aiDraggable.position.y}px)` }}
              className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 select-none items-center justify-center rounded-full border shadow-lg transition-transform duration-75 hover:scale-105 ${
                aiDraggable.isDragging ? "cursor-grabbing" : "cursor-grab"
              } ${
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
          <div className="relative flex h-full w-full max-w-xs flex-col bg-card px-2 py-6 shadow-xl transition-transform duration-300">
            <div className="flex items-center justify-between border-b border-border px-4 pb-6">
              <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
                <Sparkles className="h-6 w-6" />
                AI Tasker
              </Link>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Đóng menu điều hướng"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarNav
              sections={sections}
              activeKey={activeNavKey}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
            <div className="border-t border-border px-4 pt-4">
              {userCard(() => setIsMobileMenuOpen(false))}
              <Button
                variant="outline"
                className="flex w-full items-center justify-center gap-2 border-border text-muted-foreground hover:text-foreground"
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

export const AppShell: React.FC = () => (
  // Provider bọc ngoài để header (breadcrumb) đọc được tiêu đề do trang con đặt.
  <PageTitleProvider>
    <AppShellContent />
  </PageTitleProvider>
)
