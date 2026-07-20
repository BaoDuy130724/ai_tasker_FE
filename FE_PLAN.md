# AI Tasker — FE Plan (Delta-Sync với Backend mới)

> Kế hoạch Frontend cho **AI Tasker** (marketplace freelance tích hợp AI). FE gọi backend
> qua **Gateway** (`http://localhost:5088`). Dự án nằm ở `PRN232/ai-tasker-web/` (sibling `ai-tasker/`).
>
> **Bản này (2026-07-20) được viết lại hoàn toàn.** FE_PLAN cũ (2026-07-03) mô tả FE dựng trên
> **BE cũ** — trước 2 đợt thay đổi lớn của BE (2026-07-17 và **2026-07-20 siết auth/phân quyền**).
> Trọng tâm bản này là **đồng bộ FE với BE mới (delta-sync)**, không phải roadmap từ đầu.
> Lịch sử phase cũ được cô đọng ở **Phụ lục A** để không mất dấu.
>
> Nguồn sự thật BE: [`ai-tasker/docs/PROJECT_CONTEXT.md`](../ai-tasker/docs/PROJECT_CONTEXT.md)
> (đọc changelog 2026-07-17 & 2026-07-20 + mục 12–15).

---

## 0. TL;DR — điều quan trọng nhất

1. 🔴 **FE hiện KHÔNG chạm BE thật.** `.env` đang `VITE_USE_MOCK=true` → mọi service (trừ identity)
   chạy trên mock trong `src/mocks/`. **Mọi mục "✅ HOÀN THÀNH" ở plan cũ đều verify trên MOCK, chưa phải
   BE mới.** Việc số 1 là tắt mock rồi verify lại từng feature với BE mới.
2. 🔴 **BE 2026-07-20 đã siết auth cho Project & Job** (trước đây ẩn danh rút được escrow, duyệt được
   milestone, tự khai `ClientId`). FE phải: bỏ `clientId` khỏi body Job, và đảm bảo mọi call Project
   đều kèm token + đúng vai trò (Client/Expert/Admin).
3. ✅ **gRPC (Identity/Job/Marketplace) NAY ĐÃ BẬT** — các màn Admin (dashboard/user/job/service) trước
   đây ghi "gRPC chưa bật → sẽ lỗi" nay chạy thật được; cần re-verify live + dọn comment cũ.
4. ⏳ **Gaps giữ nguyên**: File chưa qua Gateway, Messaging/AI chưa có JWT, Order chưa có entity BE.

---

## 1. Phương pháp audit (bản này dựa trên code thật, không chỉ đọc doc)

Đã đối chiếu trực tiếp code FE (`src/`) với BE mới (`PROJECT_CONTEXT.md` + controller thật). Kết quả
đáng chú ý — **doc cũ trôi lệch code**:

| Kiểm chứng | Kết quả |
| :--- | :--- |
| `.env` `VITE_USE_MOCK` | **`true`** — FE đang chạy mock, chưa nối BE mới (trừ identity). |
| `.env` `VITE_IDENTITY_SERVICE_URL` | **`https://localhost:5001`** — **cổng ma** (BE mục 11: Identity REST thật = `http://localhost:5285`; `5001` đã chết). Comment trong `.env` còn khẳng định sai điều ngược lại. |
| `.env` `VITE_ADMIN_SERVICE_URL` | **thiếu** → default `http://localhost:5007` trong `client.ts` (BE thật = `5030/5031`). |
| Token gắn vào mọi service | ✅ `shared/api/client.ts` interceptor gắn `Bearer` cho **tất cả** instance (gồm `projectApi`, `jobApi`) + xử lý 401 refresh single-flight. |
| Gateway route | ✅ có route cho identity/profile/job/project/marketplace/review/notification/messaging/ai/admin. **Thiếu `/api/file`** (đúng gap đã biết) → FE gọi File **trực tiếp** (`getBaseUrl`: `service !== "file"`). |
| RegisterPage role | ✅ **đã chỉ `["Client","Expert"]`** (`auth/pages/RegisterPage.tsx:14`) — khớp BE mục 15.5, không cần sửa. |
| Role gating ProjectDetailPage | ✅ đã gate `isClient`/`isExpert` (deposit/createMilestone/requestRevision = Client; withdraw/submitDeliverable = Expert) — khớp `ProjectAccessPolicy`. |
| `jobs/api.ts` | 🔴 vẫn gửi `clientId` trong body `createJob`/`updateJob`/`closeJob` — BE mới đã **xoá `ClientId` khỏi DTO** và `close` không nhận body (lấy từ token). |

---

## 2. Bảng Delta — BE mới ⇒ tác động FE ⇒ hành động

> Nguồn BE: mục 15 (siết auth), mục 5.1/10 (gRPC), mục 12–13 (Profile/File JWT), mục 4 (ID types).

| # | Thay đổi BE (mới) | Tác động FE | Hành động | Ưu tiên |
| :-- | :--- | :--- | :--- | :--- |
| D1 | *(FE)* Mock đang bật | FE không chạm BE mới | Tắt `VITE_USE_MOCK`, verify từng feature live | **P0** |
| D2 | Identity REST = `5285`, Admin = `5030` | `.env` trỏ cổng ma `5001`, admin default `5007` sai | Sửa `.env` (chỉ quan trọng khi gateway off) | **P0** |
| D3 | Job bắt JWT; `ClientId` suy từ token, xoá khỏi `Create/Update/CloseJobRequest` (mục 15.3) | `jobs/api.ts` gửi `clientId` thừa; `closeJob` gửi body vô nghĩa | Bỏ `clientId` khỏi input + call sites | **P1** |
| D4 | Project bắt `[Authorize]` toàn bộ + `ProjectAccessPolicy` (mục 15.1) | Trước ẩn danh chạy được; nay 401 nếu thiếu token, 403 nếu sai vai trò | Token đã có ✅ — **re-verify live** + phân biệt 401/403 trong UX | **P1** |
| D5 | Register chặn `Role=Admin` (mục 15.5) | — | Đã khớp ✅. Ghi chú cách tạo Admin (sửa DB) | — |
| D6 | gRPC Identity/Job/Marketplace **đã bật** (mục 10) | Admin dashboard/user/job/service nay chạy thật | Dọn comment "gRPC chưa bật" + re-verify live | **P2** |
| D7 | Profile JWT; `GET /profiles/{id}` = AllowAnonymous (mục 12) | Avatar/profile công khai vẫn xem được | Verify token cho `/me/*`; giữ public profile | **P2** |
| D8 | Review & Messaging đổi `Guid→int` (mục 4) | FE workaround `intToGuid` cho Review/Messaging có thể thừa | Verify FE đã dùng `int` thuần (commit `3339834` đã refactor) | **P2** |
| D9 | File: có JWT + policy theo category, **nhưng chưa route Gateway, chưa ai gọi** (mục 13) | Upload deliverable/attachment vẫn chặn | Giữ nguyên (avatar qua Profile; link text) — gap chờ BE PublicId | ⏳ giữ |
| D10 | Messaging/AI **vẫn chưa có JWT**; Messaging còn mạo danh `senderId` (mục 15.7) | Không siết được ở FE | Giữ nguyên, không copy pattern; chờ BE | ⏳ giữ |
| D11 | BE chưa có entity Order (gap cũ) | Phase 7 vẫn localStorage | Giữ mock store tới khi BE có Order | ⏳ giữ |

---

## 3. Việc cần làm — chi tiết theo ưu tiên

### P0 — Nối FE vào BE mới (blocker: hiện đang mock)

**P0-1. Tắt mock & verify live.** *(✅ code 2026-07-20 — mock đã tắt; ⏳ verify live cần BE chạy)*
- ✅ `.env`: `VITE_USE_MOCK=true` → `false`.
- Đây là **master task**: mọi mục P1/P2 chỉ test được thật sau khi tắt mock.
- Chạy BE: mở `ai-tasker/AITasker.slnx`, profile **"3 - All services (trừ Messaging)"** + RabbitMQ Docker
  (cho notification). Tạo tài khoản Admin: register thường rồi **sửa `UserRoles.Role = 3` dưới DB**
  (BE mục 15.5 — không còn register Admin được).
- Verify golden path từng feature + 1 edge (401/403/empty). Ghi kết quả vào **mục 5 (Checklist verify live)**.

**P0-2. Sửa `.env` cổng ma.** *(✅ hoàn thành 2026-07-20)*
- ✅ `VITE_IDENTITY_SERVICE_URL=https://localhost:5001` → `http://localhost:5285` + sửa comment sai (BE mục 11).
- ✅ Thêm `VITE_ADMIN_SERVICE_URL=http://localhost:5030`; sửa luôn default `5007`→`5030` trong `client.ts`.
- *Lưu ý:* mặc định `VITE_USE_GATEWAY=true` → hầu hết đi qua `5088`; các URL trực tiếp chỉ là fallback,
  nhưng để đúng để khi cần gọi trực tiếp không dính cổng chết.

### P1 — Sửa hành vi FE lệch BE mới (siết auth)

**P1-1. Job — bỏ `clientId` khỏi body** *(✅ hoàn thành 2026-07-20; BE mục 15.3)*
- ✅ `features/jobs/api.ts`: bỏ `clientId` khỏi `CreateJobInput`/`UpdateJobInput`; `closeJob(id)` không body.
- ✅ Call sites: `CreateJobPage.tsx` (createJob(values) thuần), `JobDetailPage.tsx` (update + close).
- Đã đối chiếu controller thật: `CreateJobRequest`/`UpdateJobRequest` BE không còn `ClientId`; `CloseJob(int id)` chỉ route param. `JobDto` + `JobStatus` (Open=0/Closed=1, serialize số) khớp FE types nguyên vẹn.

**P1-2. Project — re-verify auth + UX 401/403** *(✅ code 2026-07-20; ⏳ test live với token thật)*
- ✅ **Đã đối chiếu TOÀN BỘ contract Project BE ↔ FE bằng code thật** (controllers + commands + DTOs):
  - Request: `SubmitProposalCommand`/`ApproveProposalCommand`/`Deposit`/`Withdraw`/`CreateMilestone`/
    `SubmitDeliverable`/`OpenDispute`/`RequestRevision`/`ResolveDispute` — **khớp payload FE 100%**,
    không command nào còn nhận Id tự khai (ExpertId/ClientId đều suy từ token).
  - Response: `GET /projects` + `/projects/{id}` trả `ProjectDetailsDto` (có clientId/expertId/statusName/
    escrow balances) — khớp FE `Project` type; `MilestoneDetailsDto`, `ProposalDto`, enums
    (Project/Milestone/Proposal/Dispute status) khớp nguyên vẹn.
  - 🔧 **Đã sửa 1 lệch:** FE `Dispute` khai `statusName` — **BE `DisputeDto` KHÔNG có field này** (FE render
    bằng `status` số nên không vỡ UI, nhưng type sai sự thật). Đã bỏ `statusName`, thêm `createdAt` (BE có).
- ✅ Nút approve milestone đã gate `isClient && m.status === 2` — đúng `ProjectAccessPolicy`.
- ✅ **UX 401/403:** thêm helper `getApiErrorMessage()` (`src/lib/utils.ts`) phân biệt 401 (hết phiên) vs
  403 (không phải party của contract — kể cả `Forbid()` trần không body); áp dụng cho 8 handler trong
  `ProjectDetailPage` + 2 trong `JobDetailPage`.

**P1-3. Ghi chú tạo Admin.** Register chỉ Client/Expert (đã đúng). Bổ sung note trong README/mục 4 dưới:
tạo Admin bằng sửa `UserRoles.Role=3` trực tiếp DB Identity.

### P2 — gRPC đã bật + dọn dẹp

**P2-1. Admin — dọn comment stale + re-verify live** *(✅ comment đã dọn 2026-07-20; ⏳ verify live)*
- ✅ `features/admin/api.ts`: comment "gRPC chưa bật → sẽ lỗi runtime" đã thay bằng trạng thái thật
  (gRPC ✅ bật, port 5104/5254, lưu ý GetJobs BE bỏ qua `keyword`).
- Re-verify live: `getDashboardKpi` + `refreshDashboardKpi` (BE: 1 call → 3 gRPC), `getAdminJobs`/`removeAdminJob`,
  `getAdminServices`/`removeAdminService`, `getUsers`/`lockUser`. Route BE thật: `GET /api/admin/users`,
  `PUT /api/admin/users/{id}/lock`, `GET|DELETE /api/admin/jobs`, `GET|DELETE /api/admin/services` (BE mục 10.8).
- Cần token role **Admin**.

**P2-2. Profile/Certificate** — verify token cho `/me/*`, giữ `GET /profiles/{id}` public; `AdminCertificates`
cần token Admin (BE mục 12) — FE đã note đúng.

**P2-3. Review/Messaging ID** — ✅ verify 2026-07-20: grep toàn `src/` — `intToGuid` chỉ còn trong
`src/mocks/` (AI generationId dùng Guid là ĐÚNG vì BE AI vẫn Guid). Reviews/messaging đã int thuần.

---

## 4. Gaps giữ nguyên (KHÔNG phải việc FE lúc này — chờ BE)

- **File service** (BE mục 13): đã có JWT + policy theo category (Avatar công khai đọc; Certificate/Deliverable
  owner+Admin), **nhưng chưa route qua Gateway và chưa service nào gọi thật**. → FE: avatar dùng
  `POST /Profiles/me/avatar` (Profile), certificate/deliverable/attachment vẫn **link text**. Chờ BE route
  Gateway + `PublicId` (mục 13.4) mới làm upload thật cho Deliverable/Chat.
- **Messaging & AI chưa JWT** (BE mục 15.7): Messaging vẫn mạo danh `senderId` (`[FromForm]`); AI gọi không token.
  Không siết được ở FE, không copy pattern JWT sang. Chờ BE.
- **Order (Phase 7)**: BE chưa có entity Order → giữ `features/orders/store.ts` (localStorage). Không tự thêm
  entity domain (quyết định của BE).
- **`ApproveProposal`** chưa verify người duyệt có sở hữu job (BE gap 15.7) — chỉ ghi nhận, không workaround ở FE.
- **Notification realtime**: SignalR `/hubs/notification` OK; Job publisher event vẫn ⏳ ở BE → job created/closed
  có thể chưa bắn notification. UI nên chịu được "chưa nhận được" (fallback list, không phụ thuộc 100% realtime).

---

## 5. Checklist verify live (điền khi tắt mock + chạy BE mới)

> Chạy sau P0-1. Đánh dấu ✅/❌ + ghi lỗi thật. Đây thay cho các "✅" cũ vốn chỉ đúng trên mock.

| Feature | Luồng test | Kết quả |
| :--- | :--- | :--- |
| Auth | Register (Client/Expert) → Login → F5 giữ phiên → Logout | ⬜ |
| Job | Client tạo job (không gửi clientId) → sửa → đóng; Expert/Public xem list + filter | ⬜ |
| Proposal | Expert nộp proposal → Client duyệt → tạo Contract+Project | ⬜ |
| Project/Milestone | Client tạo milestone; Expert nộp deliverable; Client duyệt (giải ngân) / request revision | ⬜ |
| Escrow | Client deposit; Expert withdraw; xem transaction history; **sai vai trò → 403** | ⬜ |
| Dispute | Client/Expert mở dispute; Admin resolve | ⬜ |
| Marketplace | Expert tạo/publish AiService; browse/filter; favorite | ⬜ |
| Review | Sau Project Closed: review 2 chiều + reply | ⬜ |
| Notification | SignalR badge realtime; list; mark-read | ⬜ |
| Messaging | Chat realtime `/chathub` (int IDs) | ⬜ |
| AI | Sinh mô tả job/service; recommend expert | ⬜ |
| Admin | Dashboard KPI (+refresh gRPC); lock user; remove job/service; duyệt certificate | ⬜ |

---

## 6. Quy trình làm việc mỗi task
1. Đọc mục liên quan ở đây + phần BE tương ứng trong `PROJECT_CONTEXT.md`.
2. Sửa theo feature-based structure (Phụ lục B).
3. `npm run build && npm run lint` phải pass.
4. Tắt mock, chạy BE mới, test golden path + 1 edge (ưu tiên 401/403/empty).
5. Cập nhật checklist mục 5.

---

# Phụ lục A — Lịch sử phase (đã build trên MOCK, chờ verify live)

> Giữ lại để tham chiếu. **Các ✅ dưới đây = đã build UI/wiring, verify trên mock** — coi là "đã dựng",
> **chưa** đồng nghĩa "chạy đúng với BE mới". Verify thật ở mục 5.

- **Phase 0** Scaffold (Vite+React+TS, Tailwind+shadcn, TanStack Query, Zustand, RR v6, Axios, RHF+Zod, signalr) — ✅ dựng
- **Phase 1** Auth (Login/Register, Zustand: accessToken in-memory + refreshToken persist, single-flight refresh) — ✅ dựng
- **Phase 2** AppShell role-based nav + Notification SignalR + badge — ✅ dựng
- **Phase 3** Job (Client tạo/sửa/đóng + AI mô tả; Expert/Public list+filter) — ✅ dựng *(cần D3)*
- **Phase 4** Proposal → Contract/Project (stepper state machine) — ✅ dựng *(cần D4)*
- **Phase 5** Milestone/Deliverable/Escrow/Dispute — ✅ dựng *(cần D4 — quan trọng nhất vì đụng tiền)*
- **Phase 6** Marketplace (AiService, Category, Favorite) — ✅ dựng
- **Phase 7** Order — ⚠️ **localStorage mock**, BE chưa có entity Order
- **Phase 8** Admin (dashboard/user/job/service/certificate) — ✅ dựng *(cần D6 — gRPC nay đã bật, re-verify)*
- **Phase 9** Chat SignalR `/chathub` (int IDs) — ✅ dựng *(cần D8)*
- **Phase 10** AI Assistant (Gemini bubble, Q&A, recommend expert) — ✅ dựng
- **Phase 11** Polish (a11y/contrast/responsive, build sạch TS) — ⚠️ một phần

---

# Phụ lục B — Stack & cấu trúc (giữ nguyên, vẫn đúng)

| Hạng mục | Lựa chọn |
| :-- | :-- |
| Framework | React + Vite + TypeScript (khớp CORS `5173` của Gateway) |
| UI | Tailwind CSS + shadcn/ui (Product register — Slate + Violet) |
| Data fetching | TanStack Query · **Client state** Zustand |
| Realtime | @microsoft/signalr (`/hubs/notification`, `/chathub`) |
| Routing | React Router v6 (protected theo role) |
| Form | React Hook Form + Zod |

**Cấu trúc** (feature-based, mirror 12 service BE): `src/app` (shell/router/providers) · `src/features/*`
(auth, profile, jobs, proposals, contracts-projects, marketplace, reviews, notifications, messaging, orders,
admin, dashboard, home) · `src/shared` (api client, components, hooks, types, utils) · `src/mocks` (MSW-style
adapter, gỡ bằng `VITE_USE_MOCK=false`).

**Nguyên tắc thiết kế** (theo `/fk`, register = Product): color Restrained (tinted neutral + 1 accent ≤10%);
1 font family; fixed rem scale; đủ semantic state (default/hover/focus/active/disabled/loading/error/selected);
skeleton (không spinner); empty state phải **dạy** cách dùng. Tránh gradient text, glassmorphism mặc định,
card-grid đồng phục, modal-first. Screen lớn: `/fk plan <feature>` trước khi `/fk build`.

**Việc còn mở** (không chặn): package manager (npm), i18n (vi/en — chưa cần), CI/deploy (chưa cần).
