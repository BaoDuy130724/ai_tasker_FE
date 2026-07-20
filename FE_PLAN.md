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

1. ✅ **Mock đã tắt & verify live ĐÃ CHẠY (2026-07-20 chiều).** Kết quả: **FE khớp BE mới gần như
   toàn bộ** (auth/job/proposal/escrow/dispute/marketplace/review/notification/admin ✅ — xem mục 5);
   tìm được **1 bug FE** (admin baseURL qua Gateway — đã sửa, P2-1) và **1 chùm bug BE mới quanh
   escrow/milestone** (thiếu Lock → duyệt milestone luôn 500 — mục 4b, chờ BE sửa).
2. 🔴 **BE 2026-07-20 đã siết auth cho Project & Job** (trước đây ẩn danh rút được escrow, duyệt được
   milestone, tự khai `ClientId`). FE phải: bỏ `clientId` khỏi body Job, và đảm bảo mọi call Project
   đều kèm token + đúng vai trò (Client/Expert/Admin).
3. ✅ **gRPC (Identity/Job/Marketplace) NAY ĐÃ BẬT** — các màn Admin (dashboard/user/job/service) trước
   đây ghi "gRPC chưa bật → sẽ lỗi" nay chạy thật được; cần re-verify live + dọn comment cũ.
4. ⏳ **Gaps giữ nguyên**: File chưa qua Gateway, Messaging/AI chưa có JWT, Order chưa có entity BE.
5. ✅ **Audit độ phủ dữ liệu ĐÃ XONG (2026-07-20 tối, mục 7).** Đối chiếu 77 endpoint BE ↔ toàn bộ FE:
   Dashboard (E1), hồ sơ công khai + thay ID trần bằng tên thật (E2), sửa dịch vụ Marketplace (E3),
   rating tổng hợp thật (E4), file đính kèm Chat (E5), và toàn bộ field bị fetch-nhưng-không-hiển-thị
   (7.2) — **đều đã fix**. Phát hiện thêm 1 gap BE mới (chat attachment không broadcast realtime — mục 4).
   `tsc -b` + `npm run build` pass.

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

**P0-1. Tắt mock & verify live.** *(✅ code 2026-07-20 — mock đã tắt; ✅ verify live đã chạy 2026-07-20 chiều — kết quả ở mục 5, phát hiện BE mới ở mục 4b)*
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

**P2-1. Admin — dọn comment stale + re-verify live** *(✅ comment đã dọn 2026-07-20; ✅ verify live 2026-07-20 — kèm 1 fix FE)*
- 🔧 **Đã sửa bug FE (client.ts):** Gateway `admin-route` là route DUY NHẤT **không có transform**
  `PathRemovePrefix` (forward nguyên path `/api/admin/**`). FE cũ build base `/api/admin` + path
  `/admin/users` → `/api/admin/admin/users` → **404 toàn bộ màn Admin qua Gateway**. Fix: gateway mode
  của service `admin` dùng base `${gateway}/api` (không ghép segment). Verify: `/api/admin/users` 200,
  dạng cũ 404. Direct mode không đổi.
- ✅ Verify live toàn bộ: dashboard KPI (+refresh 1 call→3 gRPC, KPI cập nhật thật), users (gRPC
  Identity), jobs (gRPC Job), services (gRPC Marketplace), lock/unlock user (login bị chặn 403 thật),
  token Client vào admin API → 403 đúng.
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
- **Chat attachment không broadcast realtime** (phát hiện 2026-07-20 khi làm E5): `POST /Chat/sessions/{id}/messages/attachment`
  chỉ lưu DB qua `ChatService.SendMessageWithAttachmentAsync`, không gọi `Clients.Group(...).SendAsync("ReceiveMessage", ...)`
  như đường hub `SendMessage` (`ChatHub.cs`). Người nhận không thấy tin nhắn có file đính kèm cho tới khi tải lại lịch sử.
  FE không tự thêm broadcast được (không có quyền vào Hub từ REST call) — chờ BE thêm broadcast vào `SendMessageWithAttachmentAsync`.

## 4b. Phát hiện MỚI khi verify live 2026-07-20 (đều là BE/môi trường — FE chỉ ghi nhận)

> Test bằng HTTP qua Gateway với đúng payload FE (3 user thật: Client id=1, Expert id=2, Admin id=3).
> FE **không** sửa gì trong `ai-tasker/` — mọi mục dưới đây chờ đội BE.

1. 🔴 **Escrow thiếu bước Lock → duyệt milestone LUÔN 500.** Doc trên `EscrowAccount` ghi luồng
   *"Deposit → tiền bị Lock khi tạo milestone → Release khi Approve"*, nhưng **không code path nào gọi
   `EscrowAccount.Lock()`** (chỉ Deposit/Withdraw có command; grep toàn service chỉ thấy `Lock` trong
   unit test). Hệ quả: `ApproveMilestone` gọi `Release` khi `LockedBalance=0` →
   `InvalidOperationException: "Locked balance is less than release amount"` → 500. Fix đề xuất:
   Lock `milestone.Amount` trong `CreateMilestoneCommandHandler` (+ ghi EscrowTransaction type Lock).
   FE tạm thời: nút duyệt milestone sẽ báo lỗi chung — không phải bug FE.
2. 🔴 **Project state-machine kẹt ở `Created` → request-revision không dùng được.**
   `Project.RequestRevision()` throw khi status = `Created`, nhưng không bước nào trong luồng chuẩn
   (approve proposal → deposit → milestone → deliverable) chuyển Project sang trạng thái làm việc.
   Test live: request-revision → 500 *"Cannot request revision when status is 'Created'"*.
3. 🟠 **Domain exception → 500 thay vì 4xx**: rút quá số dư, deliver lại milestone đã Delivered,
   request-revision sai trạng thái... đều là `InvalidOperationException` không được map trong
   `ExceptionHandlingMiddleware` → FE chỉ hiện "unexpected error". Đề xuất: map về 422 như
   `BusinessRuleException`.
4. 🟠 **Xác nhận live gap 15.7 (`ApproveProposal`)**: Expert tự approve proposal của mình được (200) —
   contract tạo ra với clientId = chính expert. BE chưa verify người duyệt sở hữu job.
5. 🟡 **Review không kiểm tra trạng thái Project**: review 2 chiều + reply thành công khi Project chưa
   Closed; `reviewerId`/`replierId` vẫn tự khai trong body (Review đã validate JWT nhưng chưa dùng
   claim thay body).
6. 🟡 **Môi trường máy dev này (không phải lỗi code):**
   - Instance `localhost\SQLEXPRESS` **chết** (data root trỏ ổ `E:` không còn) → 4 service
     (Profile/Review/Marketplace/Notification) không kết nối được DB nếu chạy đúng `appsettings.json`.
   - DB `AITasker_Identity_dev` trên máy là schema ASP.NET Identity cũ (tháng 5) → Identity migrate fail
     lúc khởi động.
   - Workaround KHÔNG sửa file (đã dùng cho phiên verify): chạy service với env var override, ví dụ
     `$env:ConnectionStrings__DefaultConnection='Server=localhost;Database=AITasker_Identity_dev2;User Id=sa;Password=12345;Encrypt=True;TrustServerCertificate=True'`
     rồi `dotnet run --launch-profile http`. Dữ liệu test nằm ở `AITasker_Identity_dev2` + các
     `AITasker_*_dev` trên instance `localhost`.
   - `start-all.bat` không ổn định trên máy này (cửa sổ con không bind port); khởi động tay từng
     service hoặc bằng script PowerShell thì ổn.
7. ℹ️ **AI chạy bằng fallback** (`isFromFallback=true`) vì Gemini key đã gỡ sang user-secrets và chưa
   set lại (BE mục 15.4) — muốn AI thật: `dotnet user-secrets set "OpenAI:ApiKey" ...`.
8. ℹ️ **Tạo Admin trên DB mới**: cột `UserRoles.Role` là **chuỗi** (`'Client'/'Expert'/'Admin'`), không
   phải số 3 như BE mục 15.5 ghi — lệnh đúng: `UPDATE UserRoles SET Role='Admin' WHERE UserId=...`.

---

## 5. Checklist verify live (điền khi tắt mock + chạy BE mới)

> ✅ **Đã chạy 2026-07-20 (chiều)** — test API-level qua Gateway (`http://localhost:5088`) với đúng
> payload/URL FE tạo ra, 3 user thật (Client/Expert/Admin). Chưa gồm click-through browser & SignalR
> realtime (cần test tay trên `localhost:5173`). Chi tiết lỗi BE: **mục 4b**.

| Feature | Luồng test | Kết quả |
| :--- | :--- | :--- |
| Auth | Register (Client/Expert) → Login → refresh (F5 giữ phiên) → chặn role Admin | ✅ register/login/refresh-rotation OK; register `Admin` → 400 đúng; user shape khớp `mapAuthUser` |
| Job | Client tạo job (không gửi clientId) → sửa → đóng; Expert/Public xem list + filter | ✅ toàn bộ; anon POST → 401, Expert sửa job người khác → 403; `clientId` suy từ token; status số + statusName khớp FE |
| Proposal | Expert nộp proposal → Client duyệt → tạo Contract+Project | ✅ submit/by-job/my-proposals/approve → Contract+Project đúng shape; ⚠️ gap 15.7 xác nhận live (mục 4b.4) |
| Project/Milestone | Client tạo milestone; Expert nộp deliverable; Client duyệt (giải ngân) / request revision | ⚠️ tạo milestone + deliverable ✅ (`ProjectDetailsDto`/`MilestoneDetailsDto` khớp FE 100%); ❌ **duyệt → 500** (BE thiếu Lock — mục 4b.1); ❌ **request-revision → 500** (BE state machine — mục 4b.2) |
| Escrow | Client deposit; Expert withdraw; xem transaction history; **sai vai trò → 403** | ✅ deposit/withdraw/transactions (shape khớp `EscrowTransaction` FE); Expert deposit → 403, Client withdraw → 403, anon → 401 ✅; ⚠️ rút quá số dư → 500 thay vì 4xx (mục 4b.3) |
| Dispute | Client/Expert mở dispute; Admin resolve | ✅ open/list/resolve; Expert resolve → 403 đúng; `DisputeDto` khớp FE (có `createdAt`, không `statusName`) |
| Marketplace | Expert tạo/publish AiService; browse/filter; favorite | ✅ 4 category seed sẵn; create → Published; browse paged `{items,totalCount}`; favorite add/list OK |
| Review | Sau Project Closed: review 2 chiều + reply | ✅ create/list-by-project/reply/average-rating OK (event `review.created` → notification thật); ⚠️ BE chưa enforce Project Closed (mục 4b.5) |
| Notification | SignalR badge realtime; list; mark-read | ✅ list/mark-read/read-all OK; consumer RabbitMQ hoạt động thật (nhận `project.assigned`, `review.created`...); ⏳ SignalR realtime chưa test (cần browser) |
| Messaging | Chat realtime `/chathub` (int IDs) | ⬜ bỏ qua — DB `AITasker_Messaging_dev` chưa tồn tại + chưa JWT (gap BE cũ, mục 4) |
| AI | Sinh mô tả job/service; recommend expert | ✅ job-description 200 với payload `{roughRequirements}` — chạy **fallback** vì chưa set Gemini key (mục 4b.7); service-description/recommend chưa test riêng |
| Admin | Dashboard KPI (+refresh gRPC); lock user; remove job/service; duyệt certificate | ✅ toàn bộ sau fix FE admin baseURL (P2-1): KPI refresh cập nhật thật (3 users/3 jobs/1 service qua 3 gRPC); lock user → login 403; certificates (qua Profile) phân quyền đúng; ⏳ remove job/service chưa bấm (tránh xoá data test) |

---

## 6. Quy trình làm việc mỗi task
1. Đọc mục liên quan ở đây + phần BE tương ứng trong `PROJECT_CONTEXT.md`.
2. Sửa theo feature-based structure (Phụ lục B).
3. `npm run build && npm run lint` phải pass.
4. Tắt mock, chạy BE mới, test golden path + 1 edge (ưu tiên 401/403/empty).
5. Cập nhật checklist mục 5.

---

## 7. Audit độ phủ dữ liệu (2026-07-20) — BE trả gì nhưng FE chưa hiển thị hết

> Đối chiếu toàn bộ **77 endpoint / 11 service BE** (route + response DTO field-by-field, đọc trực tiếp
> Controllers) với toàn bộ **route + API call site FE** (route + response type + nơi field được render).
> Khác mục 5 (verify luồng nghiệp vụ chạy được hay không) — mục này trả lời riêng câu **"data BE có tồn
> tại nhưng FE có show hết cho người dùng thấy không"**.

### 7.1. Trang/tính năng chưa nối gì (0% — thiếu cả tính năng, không chỉ thiếu field)

| # | Trang/hàm | Hiện trạng | Việc cần làm | Ưu tiên |
| :-- | :--- | :--- | :--- | :--- |
| E1 | `/dashboard` (`DashboardPage`) | ✅ **Đã fix 2026-07-20.** Nối thật: Client (`getJobs` lọc `clientId`, `getProjects`, đếm proposal Pending qua `getProposalsByJob` cho từng job), Expert (`getMyProposals` + `getProjects`, tổng `escrowLockedBalance`/`escrowAvailableBalance`), Admin (`getDashboardKpi` + `getPendingCertificates`). Thêm skeleton loading + danh sách "gần đây" (job/proposal/project) thay ô rỗng tĩnh. `tsc -b`/`oxlint` sạch. | ~~Nối `getJobs`/`getMyProposals`/`getProjects` theo role~~ | ~~P1~~ ✅ |
| E2 | Xem hồ sơ người khác — `getProfileByUserId` | ✅ **Đã fix 2026-07-20.** Thêm `features/profile/pages/PublicProfilePage.tsx` (route `/profile/:userId`, chỉ đọc, chỉ hiện chứng chỉ `Approved`) + component dùng chung `shared/components/UserLink.tsx` (resolve userId→tên thật qua `getProfileByUserId`, cache trong module tránh fetch lặp trong 1 phiên trang, fallback "Người dùng #id" nếu lỗi/404). Đã thay ID trần bằng `<UserLink>` ở: `JobDetailPage` (clientId), `ProjectDetailPage` (clientId+expertId), `AiServiceDetailPage`/`FavoritesPage`/`MarketplacePage` (expertId), `JobProposalsPage` (expertId). `tsc -b`/`oxlint` sạch (không phát sinh warning mới). | ~~Thêm trang hồ sơ công khai + link từ các nơi đang show ID trần~~ | ~~P1~~ ✅ |
| E3 | Sửa dịch vụ Marketplace — `updateService` | ✅ **Đã fix 2026-07-20.** Thêm `features/marketplace/pages/EditAiServicePage.tsx` (route `/expert/services/:id/edit`, prefill từ `getServiceById`, form giống Create + thêm dropdown trạng thái Draft/Published/Archived vì `UpdateAiServiceInput` yêu cầu `status`). Thêm nút "Sửa" trong `ExpertServiceListPage`. `tsc -b` sạch. | ~~Thêm form edit~~ | ~~P2~~ ✅ |
| E4 | Rating tổng hợp thật — `getReviewsByUser` / `getAverageRating` | ✅ **Đã fix 2026-07-20.** Thêm `features/reviews/components/UserRatingSummary.tsx` (gọi đúng nguồn Review service, không phải số denormalize Marketplace) — nhúng vào cả `ProfilePage` (hồ sơ mình) và `PublicProfilePage` (hồ sơ người khác). Nhân tiện sửa luôn `ReviewSection.tsx` — chỗ hiện "User #123" trần cũng đổi sang `UserLink`. Không đổi số `averageRating` hiển thị trên card Marketplace (đó là rating theo từng *service*, khác khái niệm rating tổng hợp theo *user* của Review service — giữ nguyên vì đúng ngữ nghĩa khác nhau). `tsc -b` sạch. | ~~Thêm mục đánh giá ở trang hồ sơ~~ | ~~P2~~ ✅ |
| E5 | File đính kèm trong Chat | ✅ **Đã fix 2026-07-20.** Thêm `sendMessageAttachment()` trong `messaging/api.ts` (multipart `senderId`/`content`/`file`, đọc đúng field từ `ChatController.SendMessageWithAttachment` — verify trực tiếp code BE, không đoán). `ChatPage`: render attachment chip (tên file, dung lượng, link tải) trong bong bóng chat; thêm nút 📎 mở file picker gửi kèm. ⚠️ **Lưu ý phát hiện khi đọc code BE**: endpoint REST này KHÔNG broadcast qua SignalR (`Clients.Group(...).SendAsync("ReceiveMessage", ...)` chỉ nằm trong `ChatHub.cs` cho đường hub `SendMessage`, không có trong `ChatService.SendMessageWithAttachmentAsync`) — FE tự thêm message vào state cho người gửi thấy ngay, nhưng **người nhận sẽ không thấy realtime**, chỉ thấy khi tải lại lịch sử. Đây là gap BE, không sửa được từ FE — ghi vào mục 4 gaps. `tsc -b` sạch. | ~~Render attachment chip + nút đính kèm~~ | ~~P2~~ ✅ |
| E6 | File service (`fileApi`) | Khởi tạo axios instance trong `client.ts` nhưng **không nơi nào import** — 0% tích hợp thật. Certificate/portfolio/deliverable/dispute-evidence hiện là ô nhập URL tay | Chờ BE mở route Gateway cho `/api/file` (đã ghi nhận ở mục 4, D9) rồi thay ô nhập URL bằng upload thật | ⏳ chờ BE |

### 7.2. Field đã fetch về nhưng lặng lẽ không hiển thị — ✅ Đã fix toàn bộ 2026-07-20

| Domain | Field bị bỏ qua | Đã xử lý |
| :--- | :--- | :--- |
| Marketplace (`AiService`) | `expertName`, `expertAvatarUrl` | ✅ Giải quyết gián tiếp qua `UserLink` (E2) — resolve tên/avatar thật từ Profile service thay vì dùng field denormalize sẵn có trên DTO (đơn giản hơn, cùng 1 component dùng chung mọi nơi) |
| Marketplace (`AiService`) | `categoryName`, `totalReviews` | ✅ Thêm badge category + số lượng đánh giá cạnh sao rating ở `MarketplacePage`/`FavoritesPage`/`AiServiceDetailPage` |
| Project (`Contract` sau khi `approveProposal`) | Toàn bộ object (`terms`, `signedAt`) | ✅ BE **không có endpoint GET lại Contract** sau khi tạo — đây là cơ hội duy nhất thấy nó, nên `JobProposalsPage` giờ hiện modal điều khoản hợp đồng (mã HĐ, ngày ký, terms) trước khi điều hướng sang trang Dự án, thay vì âm thầm bỏ qua |
| Notification | `eventType` | ✅ Thêm `getEventVisual()` map icon/màu theo tiền tố event — **đã đọc code BE thật** (`RabbitMqConsumerService.cs`: `EventType = routingKey`) để lấy đúng giá trị thật (`project.assigned`, `project.closed`, `review.created`, `review.reply_created`), match theo tiền tố (`project.`/`review.`/`job.`/...) để chịu được event mới phát sinh sau này thay vì liệt kê cứng |
| Project Escrow (`EscrowTransaction`) | `status`, `note` | ✅ Thêm badge status (Pending/Completed/Failed) + dòng note trong lịch sử giao dịch ở `ProjectDetailPage` |
| Review reply | `createdAt` | ✅ Hiện mốc thời gian cạnh nhãn "Phản hồi" trong `ReviewSection` |
| Marketplace detail (`AiServiceDetailPage`) | `coverImageUrl` | ✅ Thêm banner ảnh đầu trang chi tiết (trước đó chỉ có ở list, đúng là sót UI) |

`tsc -b` + `npm run build` (Vite production build thật, không chỉ type-check) đều pass sau toàn bộ thay đổi ở mục 7.

### 7.3. Cố tình mock, không phải bug (giữ nguyên, đã ghi ở mục 4/D11)

- `orders/*` (`CreateOrderPage`, `OrderDashboardPage`) — 100% `localStorage`, BE chưa có entity Order nào để gọi.

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
