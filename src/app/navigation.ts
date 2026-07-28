import { matchPath } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import type { User } from "@/features/auth/store"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Search,
  Layers,
  Star,
  ShoppingBag,
  Heart,
  Scale,
  Wallet,
  Banknote,
  User as UserIcon,
} from "lucide-react"

export type Role = User["role"]

export interface NavItem {
  /** Path tuyệt đối, đồng thời là khoá định danh của mục sidebar. */
  to: string
  label: string
  icon: LucideIcon
}

export interface NavSection {
  /** Tiêu đề nhóm trong sidebar. Rỗng = nhóm không có nhãn. */
  title: string
  items: NavItem[]
}

/**
 * Sidebar theo role.
 *
 * Đây là nguồn sự thật DUY NHẤT cho nhãn của các mục điều hướng: breadcrumb đọc lại
 * chính nhãn này (xem `resolveLabel`) nên hai chỗ không bao giờ lệch nhau.
 *
 * "Tin nhắn" cố tình không có ở đây — nó đã là bubble nổi (ChatBubble).
 */
const NAV_SECTIONS: Record<Role, NavSection[]> = {
  Client: [
    {
      title: "Tổng quan",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Thuê chuyên gia",
      items: [
        { to: "/client/jobs", label: "Quản lý Job của tôi", icon: Briefcase },
        { to: "/jobs", label: "Thị trường Job", icon: Search },
        { to: "/client/projects", label: "Dự án & Hợp đồng", icon: FileText },
      ],
    },
    {
      title: "Dịch vụ AI",
      items: [
        { to: "/marketplace", label: "Marketplace AI", icon: Layers },
        { to: "/favorites", label: "Dịch vụ đã lưu", icon: Heart },
        { to: "/client/orders", label: "Đơn mua dịch vụ", icon: ShoppingBag },
      ],
    },
    {
      title: "Tài chính",
      items: [{ to: "/wallet", label: "Ví của tôi", icon: Wallet }],
    },
  ],
  Expert: [
    {
      title: "Tổng quan",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Nhận việc",
      items: [
        { to: "/jobs", label: "Tìm việc làm", icon: Search },
        { to: "/expert/proposals", label: "Proposals của tôi", icon: FileText },
        { to: "/expert/projects", label: "Dự án nhận làm", icon: Layers },
      ],
    },
    {
      title: "Dịch vụ AI",
      items: [
        { to: "/expert/services", label: "Dịch vụ của tôi", icon: Briefcase },
        { to: "/favorites", label: "Dịch vụ đã lưu", icon: Heart },
        { to: "/expert/orders", label: "Đơn đặt hàng", icon: ShoppingBag },
      ],
    },
    {
      title: "Tài chính",
      items: [{ to: "/wallet", label: "Ví của tôi", icon: Wallet }],
    },
  ],
  Admin: [
    {
      title: "Tổng quan",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Quản trị",
      items: [
        { to: "/admin/users", label: "Quản lý Users", icon: UserIcon },
        { to: "/admin/jobs", label: "Quản lý Job", icon: Briefcase },
        { to: "/admin/services", label: "Quản lý Dịch vụ", icon: Layers },
        { to: "/admin/certificates", label: "Duyệt Chứng chỉ", icon: Star },
        { to: "/admin/disputes", label: "Xử lý Tranh chấp", icon: Scale },
        { to: "/admin/withdrawals", label: "Duyệt rút tiền", icon: Banknote },
      ],
    },
  ],
}

export const getNavSections = (role: Role | undefined): NavSection[] =>
  role ? NAV_SECTIONS[role] ?? [] : []

const findNavItem = (role: Role | undefined, to: string): NavItem | undefined =>
  getNavSections(role)
    .flatMap((section) => section.items)
    .find((item) => item.to === to)

/** Nhóm sidebar chứa mục `to` — dùng làm nhãn "bạn đang ở tab nào". */
export const getNavSectionTitle = (role: Role | undefined, to: string | undefined): string | undefined =>
  to ? getNavSections(role).find((s) => s.items.some((i) => i.to === to))?.title : undefined

/** Giá trị có thể phụ thuộc role (ví dụ /jobs là "Thị trường Job" với Client, "Tìm việc làm" với Expert). */
type ByRole<T> = T | ((role: Role | undefined) => T)

const unwrap = <T,>(value: ByRole<T>, role: Role | undefined): T =>
  typeof value === "function" ? (value as (r: Role | undefined) => T)(role) : value

export interface RouteMeta {
  /** Pattern của react-router, khớp 1-1 với khai báo trong `routes.tsx`. */
  path: string
  /** Nhãn breadcrumb. Bỏ trống -> lấy nhãn của mục sidebar cùng path. */
  label?: ByRole<string>
  /** Breadcrumb cha (path tĩnh). Bỏ trống -> đây là gốc của chuỗi. */
  parent?: ByRole<string | undefined>
  /** Mục sidebar cần sáng lên. Bỏ trống -> chính `path`. */
  navKey?: ByRole<string | undefined>
  /**
   * Nhãn cuối là dữ liệu động (tên job, tên dự án...). Trang tự đặt qua `usePageTitle`;
   * `label` ở đây chỉ là chỗ dựa trong lúc đang tải.
   */
  dynamic?: boolean
}

/**
 * Bản đồ route -> vị trí trong cây điều hướng.
 *
 * Mỗi route protected trong `routes.tsx` phải có một dòng ở đây, nếu không thì breadcrumb
 * chỉ hiện được mỗi "Dashboard" và sidebar không sáng mục nào.
 */
const ROUTE_META: RouteMeta[] = [
  { path: "/dashboard" },

  // Chung
  { path: "/notifications", label: "Thông báo", parent: "/dashboard", navKey: () => undefined },
  { path: "/messages", label: "Tin nhắn", parent: "/dashboard", navKey: () => undefined },
  { path: "/profile/me", label: "Hồ sơ của tôi", parent: "/dashboard", navKey: () => undefined },
  {
    path: "/profile/:userId",
    label: "Hồ sơ người dùng",
    parent: "/dashboard",
    navKey: () => undefined,
    dynamic: true,
  },

  // Job
  { path: "/jobs", parent: "/dashboard" },
  { path: "/jobs/new", label: "Đăng Job mới", parent: "/client/jobs", navKey: "/client/jobs" },
  {
    path: "/jobs/:jobId/proposals",
    label: "Đề xuất ứng tuyển",
    parent: "/client/jobs",
    navKey: "/client/jobs",
  },
  { path: "/jobs/:id", label: "Chi tiết công việc", parent: "/jobs", navKey: "/jobs", dynamic: true },
  { path: "/client/jobs", parent: "/dashboard" },

  // Dự án & hợp đồng
  { path: "/client/projects", parent: "/dashboard" },
  { path: "/expert/projects", parent: "/dashboard" },
  {
    path: "/projects/:id",
    label: "Chi tiết dự án",
    // Cùng một trang nhưng vào từ hai nhánh khác nhau tuỳ vai trò.
    parent: (role) => (role === "Expert" ? "/expert/projects" : "/client/projects"),
    navKey: (role) => (role === "Expert" ? "/expert/projects" : "/client/projects"),
    dynamic: true,
  },

  // Marketplace
  { path: "/marketplace", parent: "/dashboard" },
  {
    path: "/marketplace/services/:id",
    label: "Chi tiết dịch vụ",
    parent: "/marketplace",
    navKey: "/marketplace",
    dynamic: true,
  },
  { path: "/favorites", parent: "/dashboard" },

  // Đơn hàng
  { path: "/client/orders", parent: "/dashboard" },
  {
    path: "/client/orders/new",
    label: "Đặt mua dịch vụ",
    parent: "/client/orders",
    navKey: "/client/orders",
  },
  { path: "/expert/orders", parent: "/dashboard" },

  // Proposal (Expert)
  { path: "/expert/proposals", parent: "/dashboard" },
  {
    path: "/expert/proposals/new",
    label: "Gửi đề xuất",
    parent: "/expert/proposals",
    navKey: "/expert/proposals",
  },

  // Dịch vụ của Expert
  { path: "/expert/services", parent: "/dashboard" },
  {
    path: "/expert/services/new",
    label: "Tạo dịch vụ mới",
    parent: "/expert/services",
    navKey: "/expert/services",
  },
  {
    path: "/expert/services/:id/edit",
    label: "Chỉnh sửa dịch vụ",
    parent: "/expert/services",
    navKey: "/expert/services",
    dynamic: true,
  },

  // Ví & rút tiền — dùng chung cho mọi role, nên `label` đặt thẳng ở đây thay vì để
  // resolveLabel dò trong sidebar (Admin không có mục ví trong sidebar của mình).
  { path: "/wallet", label: "Ví của tôi", parent: "/dashboard" },
  {
    path: "/wallet/withdrawals",
    label: "Rút tiền về ngân hàng",
    parent: "/wallet",
    navKey: "/wallet",
  },

  // Admin
  { path: "/admin/users", parent: "/dashboard" },
  { path: "/admin/jobs", parent: "/dashboard" },
  { path: "/admin/services", parent: "/dashboard" },
  { path: "/admin/certificates", parent: "/dashboard" },
  { path: "/admin/disputes", parent: "/dashboard" },
  { path: "/admin/withdrawals", parent: "/dashboard" },
]

// Route tĩnh luôn được thử trước route có tham số, để "/jobs/new" không rơi vào "/jobs/:id".
const STATIC_ROUTES = ROUTE_META.filter((r) => !r.path.includes(":"))
const DYNAMIC_ROUTES = ROUTE_META.filter((r) => r.path.includes(":"))

export const matchRouteMeta = (pathname: string): RouteMeta | undefined =>
  STATIC_ROUTES.find((r) => r.path === pathname) ??
  DYNAMIC_ROUTES.find((r) => matchPath({ path: r.path, end: true }, pathname))

const resolveLabel = (meta: RouteMeta, role: Role | undefined): string =>
  (meta.label && unwrap(meta.label, role)) ?? findNavItem(role, meta.path)?.label ?? meta.path.replace(/^\//, "")

/** Mục sidebar cần được đánh dấu active cho URL hiện tại (kể cả khi đang ở trang con). */
export const resolveActiveNavKey = (pathname: string, role: Role | undefined): string | undefined => {
  const meta = matchRouteMeta(pathname)
  if (!meta) return undefined
  const key = meta.navKey !== undefined ? unwrap(meta.navKey, role) : meta.path
  // Chỉ sáng khi mục đó thực sự có trong sidebar của role hiện tại.
  return key && findNavItem(role, key) ? key : undefined
}

export interface Crumb {
  label: string
  /** Không có `to` = mục cuối (trang hiện tại). */
  to?: string
}

/**
 * Chuỗi breadcrumb cho URL hiện tại, đi ngược theo `parent` chứ không cắt pathname —
 * nhờ vậy "/jobs/new" nằm dưới "Quản lý Job của tôi" đúng như luồng người dùng thật,
 * dù URL không phản ánh điều đó.
 *
 * `dynamicTitle` là tên thật do trang cung cấp (tiêu đề job, tên dự án...) và luôn
 * thắng nhãn tĩnh ở mục cuối.
 */
export const buildBreadcrumbs = (
  pathname: string,
  role: Role | undefined,
  dynamicTitle?: string | null
): Crumb[] => {
  const meta = matchRouteMeta(pathname)
  if (!meta) return []

  const chain: RouteMeta[] = [meta]
  const seen = new Set<string>([meta.path])
  let cursor: RouteMeta | undefined = meta

  while (cursor) {
    const parentPath: string | undefined = cursor.parent ? unwrap(cursor.parent, role) : undefined
    if (!parentPath || seen.has(parentPath)) break
    const parentMeta: RouteMeta | undefined = ROUTE_META.find((r) => r.path === parentPath)
    if (!parentMeta) break
    seen.add(parentPath)
    chain.unshift(parentMeta)
    cursor = parentMeta
  }

  return chain.map((item, index) => {
    const isLast = index === chain.length - 1
    return {
      label: isLast && dynamicTitle ? dynamicTitle : resolveLabel(item, role),
      // Mục cuối là chính trang đang xem -> không link. Các mục cha luôn là path tĩnh.
      to: isLast ? undefined : item.path,
    }
  })
}
