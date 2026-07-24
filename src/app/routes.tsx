import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppShell } from "@/shared/components/AppShell"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { HomePage } from "@/features/home/pages/HomePage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { NotificationListPage } from "@/features/notifications/pages/NotificationListPage"
import { CreateJobPage } from "@/features/jobs/pages/CreateJobPage"
import { JobListPage } from "@/features/jobs/pages/JobListPage"
import { ClientJobListPage } from "@/features/jobs/pages/ClientJobListPage"
import { JobDetailPage } from "@/features/jobs/pages/JobDetailPage"
import { SubmitProposalPage } from "@/features/proposals/pages/SubmitProposalPage"
import { JobProposalsPage } from "@/features/proposals/pages/JobProposalsPage"
import { ExpertProposalListPage } from "@/features/proposals/pages/ExpertProposalListPage"
import { ProjectListPage } from "@/features/contracts-projects/pages/ProjectListPage"
import { ProjectDetailPage } from "@/features/contracts-projects/pages/ProjectDetailPage"
import { MarketplacePage } from "@/features/marketplace/pages/MarketplacePage"
import { AiServiceDetailPage } from "@/features/marketplace/pages/AiServiceDetailPage"
import { FavoritesPage } from "@/features/marketplace/pages/FavoritesPage"
import { ExpertServiceListPage } from "@/features/marketplace/pages/ExpertServiceListPage"
import { CreateAiServicePage } from "@/features/marketplace/pages/CreateAiServicePage"
import { EditAiServicePage } from "@/features/marketplace/pages/EditAiServicePage"
import { CreateOrderPage } from "@/features/orders/pages/CreateOrderPage"
import { OrderDashboardPage } from "@/features/orders/pages/OrderDashboardPage"
import { AdminUserListPage } from "@/features/admin/pages/AdminUserListPage"
import { AdminCertificatePage } from "@/features/admin/pages/AdminCertificatePage"
import { AdminJobListPage } from "@/features/admin/pages/AdminJobListPage"
import { AdminServiceListPage } from "@/features/admin/pages/AdminServiceListPage"
import { AdminDisputeListPage } from "@/features/admin/pages/AdminDisputeListPage"
import { ChatPage } from "@/features/messaging/pages/ChatPage"
import { ProfilePage } from "@/features/profile/pages/ProfilePage"
import { PublicProfilePage } from "@/features/profile/pages/PublicProfilePage"

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Dashboard chung (tự render theo role) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Common routes */}
          <Route path="/messages" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/jobs" element={<JobListPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/services/:id" element={<AiServiceDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile/me" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />

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
            <Route path="/expert/proposals/new" element={<SubmitProposalPage />} />
            <Route path="/expert/proposals" element={<ExpertProposalListPage />} />
            <Route path="/expert/projects" element={<ProjectListPage />} />
            <Route path="/expert/services" element={<ExpertServiceListPage />} />
            <Route path="/expert/services/new" element={<CreateAiServicePage />} />
            <Route path="/expert/services/:id/edit" element={<EditAiServicePage />} />
            <Route path="/expert/orders" element={<OrderDashboardPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin/users" element={<AdminUserListPage />} />
            <Route path="/admin/jobs" element={<AdminJobListPage />} />
            <Route path="/admin/services" element={<AdminServiceListPage />} />
            <Route path="/admin/certificates" element={<AdminCertificatePage />} />
            <Route path="/admin/disputes" element={<AdminDisputeListPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
