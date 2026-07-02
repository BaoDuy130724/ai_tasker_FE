import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppShell } from "@/shared/components/AppShell"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { NotificationListPage } from "@/features/notifications/pages/NotificationListPage"
import { CreateJobPage } from "@/features/jobs/pages/CreateJobPage"
import { JobListPage } from "@/features/jobs/pages/JobListPage"
import { ClientJobListPage } from "@/features/jobs/pages/ClientJobListPage"
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage"
import { SubmitProposalPage } from "@/features/proposals/pages/SubmitProposalPage"
import { JobProposalsPage } from "@/features/proposals/pages/JobProposalsPage"
import { ProjectListPage } from "@/features/contracts-projects/pages/ProjectListPage"
import { ProjectDetailPage } from "@/features/contracts-projects/pages/ProjectDetailPage"
import { MarketplacePage } from "@/features/marketplace/pages/MarketplacePage"
import { AiServiceDetailPage } from "@/features/marketplace/pages/AiServiceDetailPage"
import { ExpertServiceListPage } from "@/features/marketplace/pages/ExpertServiceListPage"
import { CreateAiServicePage } from "@/features/marketplace/pages/CreateAiServicePage"
import { CreateOrderPage } from "@/features/orders/pages/CreateOrderPage"
import { OrderDashboardPage } from "@/features/orders/pages/OrderDashboardPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"
import { AdminUserListPage } from "@/features/admin/pages/AdminUserListPage"
import { AdminCertificatePage } from "@/features/admin/pages/AdminCertificatePage"
import { ChatPage } from "@/features/messaging/pages/ChatPage"

// Component hiển thị tạm thời cho các tính năng đang phát triển
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-xl">
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        Tính năng này đang được phát triển trong các Phase tiếp theo theo đúng lộ trình kế hoạch FE_PLAN.md.
      </p>
    </div>
  )
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Dashboard chung (tự render theo role) */}
          <Route path="/" element={<DashboardPage />} />

          {/* Common routes */}
          <Route path="/messages" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/services/:id" element={<AiServiceDetailPage />} />

          {/* Client Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Client"]} />}>
            <Route path="/jobs/new" element={<CreateJobPage />} />
            <Route path="/client/jobs" element={<ClientJobListPage />} />
            <Route path="/jobs/:jobId/proposals" element={<JobProposalsPage />} />
            <Route path="/client/projects" element={<ProjectListPage />} />
            <Route path="/client/orders/new" element={<CreateOrderPage />} />
            <Route path="/client/orders" element={<OrderDashboardPage />} />
          </Route>

          {/* Expert Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Expert"]} />}>
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/expert/proposals/new" element={<SubmitProposalPage />} />
            <Route path="/expert/proposals" element={<PlaceholderPage title="Quản lý Proposals đã nộp" />} />
            <Route path="/expert/projects" element={<ProjectListPage />} />
            <Route path="/expert/services" element={<ExpertServiceListPage />} />
            <Route path="/expert/services/new" element={<CreateAiServicePage />} />
            <Route path="/expert/orders" element={<OrderDashboardPage />} />
            <Route path="/profile/me" element={<PlaceholderPage title="Hồ sơ năng lực Expert" />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin/kpi" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUserListPage />} />
            <Route path="/admin/certificates" element={<AdminCertificatePage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
