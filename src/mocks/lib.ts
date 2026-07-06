/**
 * ============================================================================
 *  MOCK LAYER — core helpers (routing, response envelopes, utils)
 * ============================================================================
 *  Toàn bộ logic mock nằm gọn trong thư mục `src/mocks/`. Muốn gỡ mock:
 *    1. Đặt VITE_USE_MOCK=false (hoặc xoá dòng đó) trong .env
 *    2. (tuỳ chọn) Xoá luôn thư mục `src/mocks/` và block mock nhỏ trong
 *       `src/shared/api/client.ts`.
 *  KHÔNG có file api.ts nào của feature bị sửa — mock chặn ở tầng axios adapter.
 * ============================================================================
 */
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/features/auth/store"

/* ----------------------------- Route matching ---------------------------- */

export interface MockCtx {
  /** path params, vd { id: "5" } */
  params: Record<string, string>
  /** query string params (config.params) */
  query: Record<string, any>
  /** request body đã parse (object) */
  body: any
  config: InternalAxiosRequestConfig
}

export type MockHandler = (ctx: MockCtx) => any

export interface MockRoute {
  method: string
  pattern: string
  handler: MockHandler
}

export const route = (method: string, pattern: string, handler: MockHandler): MockRoute => ({
  method: method.toLowerCase(),
  pattern,
  handler,
})

/** Chuẩn hoá url tương đối (bỏ query, bỏ origin, bỏ trailing slash). "" -> "/" */
const normalizePath = (url?: string): string => {
  let p = (url || "/").split("?")[0]
  p = p.replace(/^https?:\/\/[^/]+/i, "")
  if (!p.startsWith("/")) p = "/" + p
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1)
  return p || "/"
}

/** So khớp pattern kiểu "/reviews/user/:userId/rating" với path thực tế. */
const matchPattern = (pattern: string, path: string): Record<string, string> | null => {
  const pp = pattern.split("/").filter(Boolean)
  const sp = path.split("/").filter(Boolean)
  if (pp.length !== sp.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      params[pp[i].slice(1)] = decodeURIComponent(sp[i])
    } else if (pp[i].toLowerCase() !== sp[i].toLowerCase()) {
      return null
    }
  }
  return params
}

/* --------------------------- Response envelopes -------------------------- */

/** Chuẩn bọc ApiResponse<T> (job, project, marketplace-detail, review, notification, admin). */
export const apiResponse = <T>(data: T, message = "OK", statusCode = 200) => ({
  success: true,
  message,
  statusCode,
  data,
})

/** PagedResult đầy đủ (page/pageSize/totalCount/totalPages) dùng ở jobs/marketplace/admin-users. */
export const paginate = <T>(all: T[], page = 1, pageSize = 10) => {
  const p = Number(page) > 0 ? Number(page) : 1
  const size = Number(pageSize) > 0 ? Number(pageSize) : 10
  const start = (p - 1) * size
  return {
    items: all.slice(start, start + size),
    page: p,
    pageSize: size,
    totalCount: all.length,
    totalPages: Math.max(1, Math.ceil(all.length / size)),
  }
}

/* ------------------------------- Small utils ----------------------------- */

/** Guid xác định từ 1 số nguyên — khớp helper intToGuid ở reviews/messaging. */
export const intToGuid = (id: number): string =>
  `00000000-0000-0000-0000-${id.toString(16).padStart(12, "0")}`

let guidCounter = 0xabc000
export const newGuid = (): string => {
  guidCounter += 1
  const hex = guidCounter.toString(16).padStart(12, "0")
  return `00000000-0000-0000-0000-${hex}`
}

/** ISO string cho thời điểm cách hiện tại `days` ngày (âm = quá khứ). */
export const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * 86400_000).toISOString()

export const nowISO = (): string => new Date().toISOString()

/** Xoá tại chỗ các phần tử thoả điều kiện (giữ tham chiếu mảng — an toàn với `import * as db`). */
export const removeWhere = <T>(arr: T[], pred: (x: T) => boolean): void => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) arr.splice(i, 1)
  }
}

/** User đang đăng nhập (từ auth store thật). Fallback 1001 khi chưa login. */
export const currentUser = () => useAuthStore.getState().user
export const currentUserId = (): number => {
  const u = currentUser()
  const n = u ? Number(u.id) : NaN
  return Number.isFinite(n) ? n : 1001
}
export const currentRole = (): string => currentUser()?.role || "Client"

/* ------------------------------- Adapter --------------------------------- */

const MOCK_DELAY = Number(import.meta.env.VITE_MOCK_DELAY ?? 220)

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const parseBody = (data: any): any => {
  if (data == null) return {}
  if (typeof data === "string") {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  if (typeof FormData !== "undefined" && data instanceof FormData) return {}
  return data
}

const buildResponse = (config: InternalAxiosRequestConfig, data: any, status = 200): AxiosResponse => ({
  data,
  status,
  statusText: status === 200 ? "OK" : "Error",
  headers: {},
  config,
  request: {},
})

/**
 * Gắn adapter mock cho 1 axios instance của service. Adapter đọc method + url
 * tương đối, khớp bảng route của service, gọi handler và trả response giả.
 * Route không khớp -> reject 404 để page tự xử lý catch (không phá refresh 401).
 */
export const attachMockAdapter = (instance: AxiosInstance, service: string, routes: MockRoute[]) => {
  instance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    await delay(MOCK_DELAY)
    const method = (config.method || "get").toLowerCase()
    const path = normalizePath(config.url)
    for (const r of routes) {
      if (r.method !== method) continue
      const params = matchPattern(r.pattern, path)
      if (params) {
        const ctx: MockCtx = {
          params,
          query: config.params || {},
          body: parseBody(config.data),
          config,
        }
        const result = r.handler(ctx)
        return buildResponse(config, result)
      }
    }
    // eslint-disable-next-line no-console
    console.warn(`[mock] Chưa có handler cho: ${service} ${method.toUpperCase()} ${path}`)
    return Promise.reject({
      isAxiosError: true,
      config,
      response: buildResponse(config, { success: false, message: "Mock endpoint not found" }, 404),
    })
  }
}
