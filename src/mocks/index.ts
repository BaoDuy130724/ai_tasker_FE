/**
 * ============================================================================
 *  MOCK LAYER — điểm vào duy nhất (public API của thư mục mocks/)
 * ============================================================================
 *  Bật/tắt bằng cờ VITE_USE_MOCK trong .env. Khi bật, client.ts sẽ gắn mock
 *  adapter cho mọi axios instance (trừ identity). Gỡ hoàn toàn: đặt cờ = false
 *  hoặc xoá thư mục này + block mock trong client.ts.
 * ============================================================================
 */
import type { AxiosInstance } from "axios"
import { attachMockAdapter } from "./lib"
import { ROUTES } from "./handlers"
import { orderSeed } from "./db"

/** Cờ tổng: mock bật khi VITE_USE_MOCK=true. */
export const MOCK_ENABLED = import.meta.env.VITE_USE_MOCK === "true"

/** Gắn mock adapter cho 1 axios instance theo tên service (nếu có route). */
export const attachMock = (instance: AxiosInstance, service: string): void => {
  const routes = ROUTES[service]
  if (routes) attachMockAdapter(instance, service, routes)
}

let seeded = false
/** Seed dữ liệu cho các mock dựa trên localStorage (orders) + log trạng thái. */
export const seedLocalMocks = (): void => {
  if (seeded) return
  seeded = true
  try {
    const KEY = "ai_tasker_mock_orders"
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(orderSeed()))
  } catch {
    /* localStorage không khả dụng — bỏ qua */
  }
  // eslint-disable-next-line no-console
  console.info(
    "%c[MOCK] Dữ liệu giả đang BẬT (VITE_USE_MOCK=true). Tắt: đặt VITE_USE_MOCK=false trong .env.",
    "color:#f59e0b;font-weight:bold"
  )
}
