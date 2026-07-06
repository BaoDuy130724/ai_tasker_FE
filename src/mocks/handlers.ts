/**
 * ============================================================================
 *  MOCK HANDLERS — bảng route cho từng service (khớp đúng path & envelope của
 *  src/features/<feature>/api.ts). Key = tên service như trong client.ts.
 * ============================================================================
 */
import {
  apiResponse, paginate, route, newGuid, nowISO, removeWhere,
  currentUser, currentUserId, currentRole, type MockRoute,
} from "./lib"
import * as db from "./db"

/* --------------------------- state phụ (mutation) ------------------------ */
// Notifications: khởi tạo theo user hiện tại, giữ trạng thái đã đọc trong phiên.
let notifState: db.MockNotification[] | null = null
const getNotifs = () => {
  if (!notifState) notifState = db.notificationSeed(currentUserId())
  return notifState
}
// Hồ sơ "me": cache để các thao tác thêm portfolio/skill/cert giữ lại trong phiên.
let meProfile: db.MockUserProfile | null = null
const getMe = (): db.MockUserProfile => {
  const u = currentUser()
  const uid = currentUserId()
  if (!meProfile || meProfile.userId !== uid) {
    meProfile = db.buildProfile({
      userId: uid,
      fullName: u?.fullName || "Người dùng hiện tại",
      email: u?.email || `user${uid}@aitasker.io`,
      role: (u?.role as any) || "Expert",
      avatar: `https://i.pravatar.cc/150?img=5`,
      title: u?.role === "Client" ? "Client" : "AI Expert",
    })
  }
  return meProfile
}

/* ================================= JOB ================================== */
const jobRoutes: MockRoute[] = [
  route("get", "/", ({ query }) => {
    let list = [...db.jobs]
    if (query.skill) list = list.filter((j) => j.skills.some((s) => s.toLowerCase().includes(String(query.skill).toLowerCase())))
    if (query.minBudget) list = list.filter((j) => j.budget >= Number(query.minBudget))
    if (query.maxBudget) list = list.filter((j) => j.budget <= Number(query.maxBudget))
    if (query.status !== undefined && query.status !== "" && query.status !== null) list = list.filter((j) => j.status === Number(query.status))
    list.sort((a, b) => (query.descending === false || query.descending === "false"
      ? +new Date(a.createdAt) - +new Date(b.createdAt)
      : +new Date(b.createdAt) - +new Date(a.createdAt)))
    return apiResponse(paginate(list, query.page, query.pageSize))
  }),
  route("get", "/:id", ({ params }) => apiResponse(db.jobs.find((j) => j.id === Number(params.id)) || null)),
  route("post", "/", ({ body }) => {
    const nj: db.MockJob = {
      id: Math.max(0, ...db.jobs.map((j) => j.id)) + 1,
      title: body.title, description: body.description, budget: Number(body.budget),
      deadline: body.deadline, skills: body.skills || [], status: 0, statusName: "Open",
      clientId: Number(body.clientId) || currentUserId(), createdAt: nowISO(), updatedAt: null,
    }
    db.jobs.unshift(nj)
    return apiResponse(nj, "Tạo job thành công")
  }),
  route("put", "/:id/close", ({ params }) => {
    const j = db.jobs.find((x) => x.id === Number(params.id))
    if (j) { j.status = 1; j.statusName = "Closed"; j.updatedAt = nowISO() }
    return apiResponse(j || null, "Đã đóng job")
  }),
  route("put", "/:id", ({ params, body }) => {
    const j = db.jobs.find((x) => x.id === Number(params.id))
    if (j) Object.assign(j, { ...body, budget: Number(body.budget), updatedAt: nowISO() })
    return apiResponse(j || null, "Cập nhật job thành công")
  }),
]

/* =============================== PROJECT ================================ */
const projectRoutes: MockRoute[] = [
  // Proposals
  route("post", "/proposals", ({ body }) => {
    const np: db.MockProposal = {
      id: Math.max(100, ...db.proposals.map((p) => p.id)) + 1,
      jobId: Number(body.jobId), expertId: currentUserId(),
      proposedPrice: Number(body.proposedPrice), estimatedDays: Number(body.estimatedDays),
      description: body.description, status: 0, createdAt: nowISO(),
    }
    db.proposals.unshift(np)
    return apiResponse(np, "Gửi đề xuất thành công")
  }),
  route("get", "/proposals/my-proposals", () => {
    const uid = currentUserId()
    const mine = db.proposals.filter((p) => p.expertId === uid)
    return apiResponse(mine.length ? mine : db.proposals)
  }),
  route("get", "/proposals/by-job/:jobId", ({ params }) =>
    apiResponse(db.proposals.filter((p) => p.jobId === Number(params.jobId)))),
  // Contracts
  route("post", "/contracts/approve-proposal", ({ body }) => {
    const proposal = db.proposals.find((p) => p.id === Number(body.proposalId))
    if (proposal) proposal.status = 1
    const contract: db.MockContract = {
      id: Math.max(500, ...db.contracts.map((c) => c.id)) + 1,
      proposalId: Number(body.proposalId),
      clientId: currentUserId(), expertId: proposal?.expertId || 2001,
      terms: "Bàn giao theo milestone, thanh toán qua Escrow.", signedAt: nowISO(),
    }
    db.contracts.push(contract)
    const project: db.MockProject = {
      id: Math.max(700, ...db.projects.map((p) => p.id)) + 1,
      contractId: contract.id, status: 0, statusName: "Created",
      createdAt: nowISO(), updatedAt: nowISO(),
      jobId: proposal?.jobId || 0, proposedPrice: proposal?.proposedPrice || 0,
      clientId: contract.clientId, expertId: contract.expertId,
      escrowTotalBalance: 0, escrowAvailableBalance: 0, escrowLockedBalance: 0,
    }
    db.projects.unshift(project)
    return apiResponse({ contract, project }, "Duyệt đề xuất & tạo dự án thành công")
  }),
  // Projects
  route("get", "/projects", () => apiResponse(db.projects)),
  route("get", "/projects/:id", ({ params }) => {
    const project = db.projects.find((p) => p.id === Number(params.id)) || null
    const ms = db.milestones.filter((m) => m.projectId === Number(params.id))
    return apiResponse({ project, milestones: ms })
  }),
  // Milestones
  route("post", "/milestones", ({ body }) => {
    const nm: db.MockMilestone = {
      id: Math.max(800, ...db.milestones.map((m) => m.id)) + 1,
      projectId: Number(body.projectId), title: body.title, description: body.description,
      dueDate: body.dueDate, amount: Number(body.amount), status: 0, statusName: "Pending",
    }
    db.milestones.push(nm)
    return apiResponse(nm, "Tạo milestone thành công")
  }),
  route("patch", "/milestones/:id/approve", ({ params }) => {
    const m = db.milestones.find((x) => x.id === Number(params.id))
    if (m) { m.status = 3; m.statusName = "Approved" }
    return apiResponse(m || null, "Đã duyệt milestone")
  }),
  route("patch", "/milestones/:id/request-revision", ({ params }) => {
    const m = db.milestones.find((x) => x.id === Number(params.id))
    if (m) { m.status = 1; m.statusName = "InProgress" }
    return apiResponse(m || null, "Đã yêu cầu chỉnh sửa")
  }),
  // Deliverables
  route("post", "/deliverables", ({ body }) =>
    apiResponse({ id: Date.now(), milestoneId: Number(body.milestoneId), fileUrl: body.fileUrl, note: body.note, submittedAt: nowISO() }, "Đã nộp bàn giao")),
  // Escrow
  route("post", "/escrow/deposit", ({ body }) => {
    const p = db.projects.find((x) => x.id === Number(body.projectId))
    const amount = Number(body.amount)
    if (p) { p.escrowTotalBalance += amount; p.escrowAvailableBalance += amount }
    const tx: db.MockEscrowTx = { id: Date.now(), escrowAccountId: Number(body.projectId), type: 0, typeName: "Deposit", amount, status: 1, statusName: "Completed", idempotencyKey: body.idempotencyKey || newGuid(), createdAt: nowISO() }
    db.escrowTxns.unshift(tx)
    return apiResponse(tx, "Nạp ký quỹ thành công")
  }),
  route("post", "/escrow/withdraw", ({ body }) => {
    const p = db.projects.find((x) => x.id === Number(body.projectId))
    const amount = Number(body.amount)
    if (p) { p.escrowTotalBalance = Math.max(0, p.escrowTotalBalance - amount); p.escrowAvailableBalance = Math.max(0, p.escrowAvailableBalance - amount) }
    const tx: db.MockEscrowTx = { id: Date.now(), escrowAccountId: Number(body.projectId), type: 3, typeName: "Withdrawal", amount, status: 1, statusName: "Completed", idempotencyKey: body.idempotencyKey || newGuid(), createdAt: nowISO() }
    db.escrowTxns.unshift(tx)
    return apiResponse(tx, "Rút ký quỹ thành công")
  }),
  route("get", "/escrow/transactions", ({ query }) => {
    const items = db.escrowTxns.filter((t) => !query.projectId || t.escrowAccountId === Number(query.projectId))
    return apiResponse({ items, totalCount: items.length })
  }),
  // Disputes
  route("get", "/disputes", ({ query }) =>
    apiResponse(db.disputes.filter((d) => !query.projectId || d.projectId === Number(query.projectId)))),
  route("post", "/disputes", ({ body }) => {
    const nd: db.MockDispute = {
      id: Math.max(600, ...db.disputes.map((d) => d.id)) + 1,
      projectId: Number(body.projectId), openedBy: currentUserId(), openerRole: currentRole(),
      description: body.description, evidenceFileUrl: body.evidenceFileUrl || null,
      status: 0, statusName: "Open", resolution: null, resolvedBy: null, resolvedAt: null,
    }
    db.disputes.unshift(nd)
    return apiResponse(nd, "Đã mở tranh chấp")
  }),
  route("patch", "/disputes/:id/resolve", ({ params, body }) => {
    const d = db.disputes.find((x) => x.id === Number(params.id))
    if (d) { d.status = 2; d.statusName = "Resolved"; d.resolution = Number(body.resolution); d.resolvedBy = currentUserId(); d.resolvedAt = nowISO() }
    return apiResponse(d || null, "Đã xử lý tranh chấp")
  }),
]

/* ============================= MARKETPLACE ============================= */
const marketplaceRoutes: MockRoute[] = [
  route("get", "/services", ({ query }) => {
    let list = [...db.services]
    if (query.searchTerm) list = list.filter((s) => s.title.toLowerCase().includes(String(query.searchTerm).toLowerCase()) || s.description.toLowerCase().includes(String(query.searchTerm).toLowerCase()))
    if (query.categoryId) list = list.filter((s) => s.categoryId === Number(query.categoryId))
    if (query.minPrice) list = list.filter((s) => s.price >= Number(query.minPrice))
    if (query.maxPrice) list = list.filter((s) => s.price <= Number(query.maxPrice))
    if (query.minRating) list = list.filter((s) => s.rating >= Number(query.minRating))
    if (query.sortBy === "price") list.sort((a, b) => query.isDescending ? b.price - a.price : a.price - b.price)
    else if (query.sortBy === "rating") list.sort((a, b) => b.rating - a.rating)
    // getServices trả RAW PagedResult (không bọc ApiResponse)
    return paginate(list, Number(query.pageIndex) || 1, Number(query.pageSize) || 12)
  }),
  route("get", "/services/:id", ({ params }) => apiResponse(db.services.find((s) => s.id === Number(params.id)) || null)),
  route("post", "/services", ({ body }) => {
    const ns: db.MockAiService = {
      id: Math.max(10, ...db.services.map((s) => s.id)) + 1,
      expertId: currentUserId(), categoryId: Number(body.categoryId),
      categoryName: db.categories.find((c) => c.id === Number(body.categoryId))?.name,
      title: body.title, description: body.description, price: Number(body.price),
      deliveryTimeDays: Number(body.deliveryTimeDays), coverImageUrl: body.coverImageUrl || null,
      status: "Published", skills: body.skills || [], rating: 0, reviewsCount: 0,
      createdAt: nowISO(), updatedAt: null,
    }
    db.services.unshift(ns)
    return apiResponse(ns, "Đăng dịch vụ thành công")
  }),
  route("put", "/services/:id", ({ params, body }) => {
    const s = db.services.find((x) => x.id === Number(params.id))
    if (s) Object.assign(s, { ...body, price: Number(body.price), updatedAt: nowISO() })
    return apiResponse(s || null, "Cập nhật dịch vụ thành công")
  }),
  route("delete", "/services/:id", ({ params }) => {
    removeWhere(db.services, (s) => s.id === Number(params.id))
    return apiResponse(true, "Đã xoá dịch vụ")
  }),
  route("get", "/categories", () => db.categories), // RAW array
  route("get", "/favorites", () => apiResponse(db.favorites)),
  route("post", "/favorites", ({ body }) => {
    const svc = db.services.find((s) => s.id === Number(body.serviceId))
    const fav: db.MockFavorite = { id: Date.now(), clientId: currentUserId(), serviceId: Number(body.serviceId), createdAt: nowISO(), service: svc! }
    if (svc && !db.favorites.some((f) => f.serviceId === svc.id)) db.favorites.push(fav)
    return apiResponse(fav, "Đã thêm vào yêu thích")
  }),
  route("delete", "/favorites/:id", ({ params }) => {
    removeWhere(db.favorites, (f) => f.serviceId === Number(params.id))
    return apiResponse(true, "Đã bỏ yêu thích")
  }),
]

/* =============================== REVIEW =============================== */
const reviewRoutes: MockRoute[] = [
  route("post", "/reviews", ({ body }) => {
    const nr: db.MockReview = {
      id: newGuid(), projectId: body.projectId, reviewerId: Number(body.reviewerId),
      revieweeId: Number(body.revieweeId), rating: Number(body.rating),
      comment: body.comment ?? null, createdAt: nowISO(), reply: null,
    }
    db.reviews.unshift(nr)
    return apiResponse(nr, "Gửi đánh giá thành công")
  }),
  route("post", "/replies", ({ body }) => {
    const reply = { id: newGuid(), reviewId: body.reviewId, replierId: Number(body.replierId), content: body.content, createdAt: nowISO() }
    const r = db.reviews.find((x) => x.id === body.reviewId)
    if (r) r.reply = reply
    return apiResponse(reply, "Đã phản hồi đánh giá")
  }),
  route("get", "/reviews/user/:userId/rating", ({ params }) => {
    const uid = Number(params.userId)
    const rs = db.reviews.filter((r) => r.revieweeId === uid)
    const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0
    return apiResponse({ userId: uid, averageRating: Math.round(avg * 10) / 10, totalReviews: rs.length })
  }),
  route("get", "/reviews/user/:userId", ({ params }) =>
    apiResponse(db.reviews.filter((r) => r.revieweeId === Number(params.userId)))),
  route("get", "/reviews/project/:projectId", ({ params }) =>
    apiResponse(db.reviews.filter((r) => r.projectId === params.projectId))),
]

/* ============================ NOTIFICATION ============================ */
const notificationRoutes: MockRoute[] = [
  route("get", "/notifications", () => apiResponse(getNotifs())),
  route("put", "/notifications/read-all", () => { getNotifs().forEach((n) => (n.isRead = true)); return apiResponse(true) }),
  route("put", "/notifications/:id/read", ({ params }) => {
    const n = getNotifs().find((x) => x.id === Number(params.id))
    if (n) n.isRead = true
    return apiResponse(true)
  }),
]

/* ============================= MESSAGING ============================= */
// Messaging trả RAW DTO (không bọc ApiResponse)
const messagingRoutes: MockRoute[] = [
  route("post", "/Chat/sessions", ({ body }) => {
    const existing = db.chatSessions.find((s) => s.clientId === body.clientId && s.expertId === body.expertId)
    if (existing) return existing
    const ns: db.MockChatSession = {
      id: newGuid(), clientId: body.clientId, expertId: body.expertId,
      jobId: body.jobId ?? null, createdAt: nowISO(), updatedAt: nowISO(), lastMessage: null,
    }
    db.chatSessions.unshift(ns)
    return ns
  }),
  route("get", "/Chat/sessions/user/:userId", ({ params }) => {
    const mine = db.chatSessions.filter((s) => s.clientId === params.userId || s.expertId === params.userId)
    return mine.length ? mine : db.chatSessions // luôn có data để xem UI
  }),
  route("get", "/Chat/sessions/:sessionId/messages", ({ params }) => {
    const msgs = db.chatMessages.filter((m) => m.sessionId === params.sessionId)
    return msgs.length ? msgs : db.chatMessages.filter((m) => m.sessionId === db.chatSessions[0]?.id)
  }),
  route("put", "/Chat/sessions/:sessionId/read/:userId", () => ({ success: true })),
]

/* ============================== PROFILE ============================== */
// Profile & Skills & AdminCertificates — RAW DTO (không bọc ApiResponse)
const profileRoutes: MockRoute[] = [
  route("get", "/Profiles/me", () => getMe()),
  route("put", "/Profiles/me", ({ body }) => {
    const me = getMe()
    Object.assign(me, { fullName: body.fullName, title: body.title, bio: body.bio })
    return me
  }),
  route("post", "/Profiles/me/avatar", () => ({ avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`, message: "Cập nhật ảnh đại diện thành công" })),
  route("post", "/Profiles/me/portfolio", ({ body }) => {
    const item = { id: newGuid(), title: body.title, description: body.description, link: body.link, imageUrl: body.imageUrl }
    getMe().portfolioItems.push(item)
    return item
  }),
  route("delete", "/Profiles/me/portfolio/:id", ({ params }) => {
    const me = getMe(); me.portfolioItems = me.portfolioItems.filter((p) => p.id !== params.id)
    return { success: true }
  }),
  route("post", "/Profiles/me/skills/:skillId", ({ params }) => {
    const sk = db.skills.find((s) => s.id === params.skillId)
    if (sk && !getMe().skills.some((x) => x.id === sk.id)) getMe().skills.push(sk)
    return { success: true }
  }),
  route("post", "/Profiles/me/certificates", ({ body }) => {
    const cert = { id: newGuid(), name: body.name, fileUrl: body.fileUrl, issuedBy: body.issuedBy, issueDate: body.issueDate, status: "Pending" }
    getMe().certificates.push(cert)
    return cert
  }),
  route("get", "/Profiles/:userId", ({ params }) => db.profileForUser(Number(params.userId))),
  route("get", "/Skills", () => db.skills),
  // Admin certificate moderation (qua profile service)
  route("get", "/AdminCertificates", () => db.pendingCertificates),
  route("put", "/AdminCertificates/:id/approve", ({ params }) => {
    removeWhere(db.pendingCertificates, (c) => c.id === params.id)
    return { success: true, message: "Đã duyệt chứng chỉ" }
  }),
  route("put", "/AdminCertificates/:id/reject", ({ params }) => {
    removeWhere(db.pendingCertificates, (c) => c.id === params.id)
    return { success: true, message: "Đã từ chối chứng chỉ" }
  }),
]

/* =============================== ADMIN =============================== */
const adminRoutes: MockRoute[] = [
  route("get", "/admin/users", ({ query }) => {
    let list = [...db.adminUsers]
    if (query.keyword) list = list.filter((u) => u.fullName.toLowerCase().includes(String(query.keyword).toLowerCase()) || u.email.toLowerCase().includes(String(query.keyword).toLowerCase()))
    if (query.role) list = list.filter((u) => u.role === query.role)
    return apiResponse(paginate(list, query.page, query.pageSize))
  }),
  route("put", "/admin/users/:id/lock", ({ params, body }) => {
    const u = db.adminUsers.find((x) => x.id === Number(params.id))
    if (u) u.isLocked = body.isLocked ?? !u.isLocked
    return apiResponse(true, "Cập nhật trạng thái người dùng")
  }),
  route("get", "/admin/dashboard", () => apiResponse(db.dashboardKpi())),
  route("post", "/admin/dashboard/refresh", () => apiResponse(db.dashboardKpi(), "Đã làm mới KPI")),
  route("get", "/admin/jobs", ({ query }) => {
    let list = db.adminJobsView()
    if (query.keyword) list = list.filter((j) => j.title.toLowerCase().includes(String(query.keyword).toLowerCase()))
    if (query.status) list = list.filter((j) => j.status === query.status)
    return apiResponse({ items: list, totalCount: list.length })
  }),
  route("delete", "/admin/jobs/:id", ({ params }) => {
    removeWhere(db.jobs, (j) => j.id === Number(params.id))
    return apiResponse(true, "Đã gỡ job")
  }),
  route("get", "/admin/services", ({ query }) => {
    let list = db.adminServicesView()
    if (query.keyword) list = list.filter((s) => s.title.toLowerCase().includes(String(query.keyword).toLowerCase()))
    return apiResponse({ items: list, totalCount: list.length })
  }),
  route("delete", "/admin/services/:id", ({ params }) => {
    removeWhere(db.services, (s) => s.id === Number(params.id))
    return apiResponse(true, "Đã gỡ dịch vụ")
  }),
]

/* ================================= AI ================================= */
// AI trả RAW DTO. FE đọc: data.jobDescription / data.serviceDescription / data.recommendedExperts
const aiRoutes: MockRoute[] = [
  route("post", "/aiservices/job-description", ({ body }) => {
    const kw = body.roughRequirements || "giải pháp AI"
    return {
      generationId: newGuid(),
      title: `Tuyển chuyên gia: ${String(kw).slice(0, 60)}`,
      jobDescription: `## Mô tả công việc\n\nChúng tôi đang tìm kiếm một chuyên gia AI để thực hiện: ${kw}.\n\n**Phạm vi công việc:**\n- Phân tích yêu cầu & đề xuất kiến trúc giải pháp\n- Triển khai, kiểm thử và tối ưu mô hình\n- Bàn giao mã nguồn, tài liệu và hướng dẫn vận hành\n\n**Yêu cầu ứng viên:**\n- Kinh nghiệm thực chiến với các dự án AI/ML production\n- Giao tiếp tốt, bàn giao đúng tiến độ\n\n**Sản phẩm bàn giao:** mã nguồn, tài liệu kỹ thuật, buổi hướng dẫn chuyển giao.`,
      category: "Chatbot & LLM",
      budget: { min: 15_000_000, max: 40_000_000, currency: "VND" },
      suggestedSkills: ["Python", "Machine Learning", "LLM / RAG", "NLP"],
      experienceLevel: "Intermediate",
      estimatedDuration: "3-5 tuần",
      isFromFallback: false,
      generatedAt: nowISO(),
    }
  }),
  route("post", "/aiservices/service-description", ({ body }) => {
    const kw = body.keywords || "dịch vụ AI"
    return {
      generationId: newGuid(),
      packageName: `Gói dịch vụ: ${String(kw).slice(0, 50)}`,
      serviceDescription: `## Giới thiệu gói dịch vụ\n\nTôi cung cấp giải pháp **${kw}** chất lượng cao, tối ưu cho doanh nghiệp.\n\n**Tính năng nổi bật:**\n- Triển khai nhanh, đúng chuẩn production\n- Tối ưu hiệu năng và chi phí vận hành\n- Hỗ trợ tích hợp và bảo hành sau bàn giao\n\n**Bạn sẽ nhận được:** mã nguồn, tài liệu, và hỗ trợ triển khai.`,
      keyFeatures: ["Triển khai production-ready", "Tối ưu chi phí", "Bảo hành 30 ngày"],
      deliverables: ["Mã nguồn", "Tài liệu kỹ thuật", "Buổi hướng dẫn"],
      pricingTier: "Standard",
      suggestedPrice: 12_000_000,
      estimatedDeliveryTime: "2-3 tuần",
      tags: ["AI", "Machine Learning", "Automation"],
      isFromFallback: false,
      generatedAt: nowISO(),
    }
  }),
  route("post", "/aiservices/recommend-experts", () => ({
    totalMatched: 3,
    searchStrategy: "vector-search",
    recommendedExperts: [2002, 2001, 2003].map((id, i) => {
      const p = db.findPerson(id)
      return {
        expertId: id, fullName: p.fullName, matchScore: [96, 91, 88][i],
        skills: db.services.find((s) => s.expertId === id)?.skills || ["AI", "Python"],
        availabilityStatus: "Available",
      }
    }),
  })),
]

/* ================================ FILE ================================ */
const fileRoutes: MockRoute[] = [
  route("post", "/files", ({ body }) => apiResponse({
    id: newGuid(), fileName: body?.fileName || "upload.bin", contentType: "application/octet-stream",
    size: 102400, category: "Attachment", ownerId: currentUserId(),
    url: "https://picsum.photos/seed/file/400/300", createdAt: nowISO(),
  })),
  route("get", "/files", () => apiResponse([])),
]

/* ------------------------------------------------------------------------ */
export const ROUTES: Record<string, MockRoute[]> = {
  job: jobRoutes,
  project: projectRoutes,
  marketplace: marketplaceRoutes,
  review: reviewRoutes,
  notification: notificationRoutes,
  messaging: messagingRoutes,
  profile: profileRoutes,
  admin: adminRoutes,
  ai: aiRoutes,
  file: fileRoutes,
}
