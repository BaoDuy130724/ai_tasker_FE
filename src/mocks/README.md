# Lớp Mock Data (`src/mocks/`)

Dữ liệu giả tập trung 1 chỗ để **xem UI có data ngay mà không cần chạy BE** cho tất cả
service **trừ `identity` và `gateway`**. Mock chặn ở tầng **axios adapter** nên **không file
`api.ts` nào của feature bị sửa**.

## Bật / Tắt

Trong `.env`:

```env
VITE_USE_MOCK=true     # true = dùng mock | false = gọi API thật
VITE_MOCK_DELAY=220    # (tuỳ chọn) độ trễ giả lập mỗi request (ms)
```

Đổi cờ xong **khởi động lại `npm run dev`** (Vite chỉ đọc env lúc start).

> ⚠️ `identity` **không** bị mock — vẫn cần chạy identity BE thật để đăng nhập.
> Sau khi login, mọi trang protected sẽ hiển thị data giả từ lớp này.

## Cách hoạt động

- `client.ts` gọi `attachMock(instance, service)` cho mỗi axios instance (trừ identity) khi
  `MOCK_ENABLED`. Adapter đọc `method` + `url` tương đối, khớp bảng route của service trong
  `handlers.ts`, rồi trả response giả **đúng envelope** mà `api.ts` mong đợi:
  - Bọc `ApiResponse<T>`: job, project, review, notification, admin, marketplace-detail
  - RAW DTO: profile, messaging, AI, marketplace `/categories`
  - RAW `PagedResult`: marketplace `/services`
- Route không khớp → reject 404 kèm cảnh báo `[mock] Chưa có handler cho: ...` trong console.
- Các endpoint `me` / `my` đọc user đang đăng nhập từ auth store để khớp quyền sở hữu.
- Dữ liệu là mảng mutable → tạo/khoá/đánh dấu-đã-đọc phản ánh ngay trong phiên (mất khi F5).
- `orders` vốn là mock localStorage sẵn có → được seed vào `localStorage` nếu đang trống.

## Cấu trúc

| File | Vai trò |
|------|---------|
| `index.ts` | Public API: `MOCK_ENABLED`, `attachMock()`, `seedLocalMocks()` |
| `lib.ts` | Router (match path), adapter, helper envelope (`apiResponse`, `paginate`), utils |
| `db.ts` | **Toàn bộ dữ liệu giả** (khớp field FE `types.ts` + DTO BE) |
| `handlers.ts` | Bảng route + logic cho từng service |

## Gỡ mock hoàn toàn

1. Đặt `VITE_USE_MOCK=false` trong `.env`, **hoặc**
2. Xoá thư mục `src/mocks/` và bỏ block đánh dấu `[MOCK]` trong `src/shared/api/client.ts`
   (2 chỗ: import ở đầu file + block gắn adapter trong `createServiceInstance`).

Không còn dấu vết nào khác trong codebase.
