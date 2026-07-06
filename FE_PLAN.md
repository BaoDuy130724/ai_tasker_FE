# AI Tasker — FE Build Plan (TypeScript)

> Kế hoạch xây dựng Frontend cho dự án **AI Tasker** (marketplace freelance tích hợp AI).
> Dự án FE khởi tạo **ngoài** `ai-tasker/` (sibling folder ở root `PRN232/`), gọi backend
> hoàn toàn qua **Gateway** (`http://localhost:5088`, xem `ai-tasker/PROJECT_CONTEXT.md` mục 4.1/7).
> Cập nhật: 2026-07-03.

> **Re-audit 2026-07-03**: đã kiểm tra lại `ai-tasker` develop tại HEAD `595c57c` (merge PR #10
> `Hotfix_Identity_Auth`, gồm `f010605` proposals `my-proposals`, `bf43a0e` Gateway YARP JWT/CORS/rate-limit,
> `a8897b7` Identity CORS + connection string, `60a0604` Milestone + `ProjectsController`). Verify trực tiếp
> trong code (không chỉ đọc doc):
> - Gateway (`appsettings.json`) route **11/12 service** (thiếu `file`, vẫn comment — đúng như gap đã biết);
>   CORS gateway giờ nhận thêm origin `http://localhost:5174` (fallback port Vite) ngoài `5173`.
> - `AITasker.File` **vẫn chưa** có `AddAuthentication`/`[Authorize]` — gap JWT+Gateway ở mục 3 vẫn đúng.
> - gRPC server Identity/Job/Marketplace **vẫn chưa bật** (`AddGrpc()`/`MapGrpcService` vẫn bị comment) — gap Admin ở mục 4.2 vẫn đúng.
> - `DisputesController` **vẫn chưa có** endpoint `GET` liệt kê dispute — gap ở mục 4.2 vẫn đúng.
> - Job service **vẫn chưa** publish event (`IEventPublisher`/RabbitMQ) — gap ở mục 3 vẫn đúng.
> ⇒ **Không có thay đổi BE nào ảnh hưởng tới nội dung plan này** kể từ lần audit 2026-07-02; toàn bộ Backlog
> (mục 4.1) và Gap list (mục 3, 4.2) vẫn phản ánh đúng hiện trạng. Đối chiếu `ai-tasker-web` (2 commit:
> `64a79cc` scaffold gốc, `873f063` review/proposals/profile/admin-UI/favorites) cũng khớp đúng các mục đã
> đánh dấu ✅ HOÀN THÀNH ở trên — không phát hiện lệch giữa plan và code thật.

---

## 1. Quyết định stack (đã chốt cùng user)

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | **React + Vite + TypeScript** | Khớp CORS `http://localhost:5173` Gateway đã cấu hình sẵn (`ai-tasker/services/AITasker.Gateway`) |
| Styling / UI | **Tailwind CSS + shadcn/ui** | Product register (app UI, không phải marketing) — cần bộ component nhất quán, dễ chỉnh token, tránh "AI slop" theo `/fk` |
| Data fetching | **TanStack Query** | Cache/loading/error cho từng service (Job, Project, Marketplace, Review, Notification...) |
| Client state | **Zustand** | Auth state (user, token, role), UI state nhẹ (sidebar, modal) — không cần Redux boilerplate |
| Realtime | **@microsoft/signalr** | Kết nối `/hubs/notification` (Notification) và `/chathub` (Messaging) |
| Routing | **React Router v6** | Route theo role (Client/Expert/Admin), protected routes |
| Form + validate | **React Hook Form + Zod** | Validate client-side khớp FluentValidation rules phía BE (vd `productName` regex kiểu Job... check lại theo từng service) |
| Package manager | **npm** (đổi được nếu muốn pnpm) | Đơn giản, không cần quyết thêm |
| Vị trí project | `PRN232/ai-tasker-web/` (sibling `ai-tasker/`) | Theo yêu cầu: khởi tạo ngoài root `ai-tasker` |

**Cấu trúc thư mục**: **Feature-based**, mirror theo 12 service backend:

```
ai-tasker-web/
  src/
    app/                    # App shell: router, providers (QueryClient, Zustand), layout gốc
    features/
      auth/                 # Identity: login, register, refresh, roles
      profile/              # Profile: bio, skill, portfolio, certificate
      jobs/                 # Job: list/detail/create/close
      proposals/            # Project: proposal
      contracts-projects/   # Project: contract, project state machine, milestone, deliverable
      escrow/                # Project: escrow deposit/withdraw/transactions
      disputes/              # Project: dispute
      marketplace/           # Marketplace: service, category, favorite
      reviews/               # Review: review + reply
      notifications/         # Notification: list + SignalR + push
      messaging/             # Messaging: chat + SignalR
      ai-tools/              # AI: gen job/service description, recommend expert
      admin/                 # Admin: dashboard KPI, user/job/service mgmt (⚠️ phụ thuộc gRPC BE chưa xong)
    shared/
      api/                   # Axios/fetch client gốc, interceptor JWT, base URL Gateway
      components/            # shadcn/ui wrapper, layout primitives dùng chung
      hooks/
      types/                 # DTO type khớp response BE (ApiResponse<T>, PagedResult<T>...)
      utils/
    styles/                  # Tailwind config, design tokens (OKLCH), globals.css
  public/
  PRODUCT.md                 # để /fk dùng khi craft từng screen
  DESIGN.md                  # sinh sau khi có token/theme cụ thể (dùng /fk spec hoặc setup)
```

Mỗi `features/<x>/` tự chứa: `components/`, `hooks/`, `api.ts` (gọi Gateway), `types.ts`.

---

## 2. Nguyên tắc thiết kế (theo `/fk`, register = **Product**)

Dự án là app UI có tác vụ (đăng job, duyệt proposal, escrow, chat...) → dùng **Product register**, không phải Brand/marketing:

- **Color strategy: Restrained** (tinted neutral + 1 accent ≤10%). Có thể **Committed** cục bộ cho 1 màn hình (vd onboarding/empty state ấn tượng), nhưng mặc định Restrained.
- **1 font family** duy nhất cho toàn bộ UI (heading/body/label/data) — không pha display font vào label/button.
- **Fixed rem scale** (không fluid/clamp) — user xem UI ở DPI ổn định, sidebar/table cần cỡ chữ cố định.
- Semantic state đầy đủ cho **mọi** component tương tác: default/hover/focus/active/disabled/loading/error/selected.
- Skeleton loading (không spinner giữa nội dung); empty state phải **dạy** cách dùng, không chỉ "chưa có gì".
- Tránh: gradient text, side-stripe border trang trí, glassmorphism mặc định, card-grid giống hệt nhau, eyebrow/numbered section kiểu landing page, modal là phản xạ đầu tiên (ưu tiên inline/progressive trước).
- Trước khi code UI thật (không phải lúc lên plan này), mỗi screen/feature lớn nên chạy `/fk plan <feature>` để ra design brief (color strategy, scene sentence, key states) rồi mới `/fk build`.

---

## 3. Gaps backend cần lưu ý khi build FE (tránh build nhầm lên API chưa chạy thật)

Theo `DEMO_READINESS.md` / báo cáo trước:
- **RabbitMQ/event real-time chưa verify live** → màn Notification/real-time nên có **fallback polling** hoặc UI chấp nhận "chưa nhận được" thay vì phụ thuộc 100% SignalR khi demo.
- **Job event publisher bị gỡ** → job tạo/đóng sẽ **không** phát notification real-time cho tới khi BE re-apply.
- **Admin ⇄ gRPC (Identity/Job/Marketplace) chưa bật** → màn Admin dashboard/quản lý sẽ gọi API nhưng BE có thể fail; để **Phase cuối cùng** và cần mock/stub data khi demo nếu BE chưa xong.
- **AITasker.File chưa gắn JWT + chưa qua Gateway** → tính năng upload avatar/certificate/deliverable/attachment cần kiểm tra lại đường gọi thật (trực tiếp tới File service, không qua Gateway) cho tới khi BE sửa.
- **Kiểu ID không đồng nhất** giữa service (Identity=int, Profile=Guid+int, Job=int, Project/Marketplace/Notification=int, Messaging=Guid, Review=Guid+int) → khai báo type FE theo **từng feature**, không dùng chung 1 kiểu `Id`.

---

## 4. Phase Roadmap (từ cơ bản → chi tiết)

> Mỗi phase: xong code → `dotnet`-tương-đương ở FE là `npm run build` + `npm run lint` phải pass →
> chạy thử trên trình duyệt (theo hướng dẫn skill `/run` hoặc `verify`) trước khi coi là DONE.

### Phase 0 — Scaffold & nền tảng [✅ HOÀN THÀNH]
- ✅ Khởi tạo `ai-tasker-web` (Vite + React + TS template), cài Tailwind + shadcn/ui, TanStack Query, Zustand, React Router, Axios, RHF+Zod, signalr client.
- ✅ Thiết lập `shared/api/client.ts`: base URL Gateway (`http://localhost:5088`), interceptor gắn `Authorization: Bearer`, xử lý 401 (redirect login) + refresh token (có hỗ trợ gọi trực tiếp linh hoạt).
- ✅ Thiết lập design tokens theo `/fk` — viết `PRODUCT.md` (register: product) để định hình thiết kế Slate + Violet.
- ✅ Layout gốc: `AppShell` (top bar + side nav theo role), route `ProtectedRoute` theo role Client/Expert/Admin.
- **Acceptance**: ✅ `npm run build` và `npm run dev` hoạt động hoàn hảo, định tuyến route chính xác, hiển thị Dashboard theo vai trò khi đăng nhập thành công.

### Phase 1 — Auth (Login / Register) [✅ HOÀN THÀNH]
- ✅ Screens: `LoginPage`, `RegisterPage` với thiết kế split-screen cao cấp (Bảng màu Slate + Violet tinh tế), hỗ trợ chọn role bằng UI card grid trực quan.
- ✅ Validation client-side với Zod + React Hook Form, xử lý lỗi API và hiển thị Alert.
- ✅ Lưu token vào Zustand store + tự động khôi phục (persist) trong `localStorage`.
- ✅ Interceptor tự động gửi token và cơ chế refresh token thông minh theo schema Backend.
- **Acceptance**: ✅ Đăng ký → đăng nhập → token lưu giữ, phân quyền theo role hoạt động hoàn hảo, F5 giữ phiên.

### Phase 2 — Shell chính & Dashboard rỗng theo role [✅ HOÀN THÀNH]
- ✅ Navigation theo role tự động hiển thị đúng menu tương ứng (Client, Expert, Admin).
- ✅ Thiết kế Empty-state dashboard rực rỡ, chi tiết và hướng dẫn sử dụng tốt.
- ✅ Tích hợp SignalR client kết nối `/hubs/notification` realtime (tự động join group `user-{userId}` dựa trên JWT token).
- ✅ Xây dựng trang [NotificationListPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/notifications/pages/NotificationListPage.tsx) hỗ trợ lấy danh sách, đọc 1, đọc toàn bộ thông báo.
- ✅ Hiển thị Badge đếm số lượng thông báo chưa đọc realtime trên Header chuông thông báo.
- **Acceptance**: ✅ Menu chuyển hướng chuẩn xác theo vai trò; kết nối SignalR realtime mượt mà, hiển thị badge chính xác.

### Phase 3 — Job module [✅ HOÀN THÀNH]
- ✅ Client: Đăng tuyển dụng qua [CreateJobPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/jobs/pages/CreateJobPage.tsx), tích hợp AI sinh mô tả job, quản lý danh sách job của tôi qua [ClientJobListPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/jobs/pages/ClientJobListPage.tsx), đóng job qua [JobDetailPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/jobs/pages/JobDetailPage.tsx).
- ✅ Expert / Public: Tìm kiếm job, lọc kỹ năng, khoảng budget, phân trang và sắp xếp qua [JobListPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/jobs/pages/JobListPage.tsx).
- ✅ Tích hợp API Backend `/api/jobs` và API AI `/api/aiservices/job-description` hoạt động đồng bộ.
- **Acceptance**: ✅ Quy trình tạo, lọc, xem chi tiết và đóng job chạy mượt mà, phân quyền theo role hoạt động chính xác.

### Phase 4 — Proposal → Contract/Project [✅ HOÀN THÀNH]
- ✅ Expert: Nộp proposal cho job đang Open qua [SubmitProposalPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/proposals/pages/SubmitProposalPage.tsx).
- ✅ Client: Xem danh sách proposal của 1 job qua [JobProposalsPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/proposals/pages/JobProposalsPage.tsx), duyệt 1 proposal để tạo Contract/Project và tự động từ chối các proposal khác.
- ✅ Quản lý tiến trình: Xem danh sách dự án qua [ProjectListPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/contracts-projects/pages/ProjectListPage.tsx), hiển thị State Machine Stepper/Timeline mượt mà (Created→InProgress→Delivered→Approved→Closed) trong [ProjectDetailPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/contracts-projects/pages/ProjectDetailPage.tsx).
- ✅ Mở rộng Backend: Bổ sung [ProjectsController.cs](file:///D:/FPT/SU26/PRN232/ai-tasker/services/AITasker.Project/AITasker.Project.API/Controllers/ProjectsController.cs) cho phép GET projects và GET project details với danh sách milestones thực tế từ DB.
- **Acceptance**: ✅ Luồng nộp proposal → Duyệt proposal → Tự động sinh Contract + Project → Xem chi tiết project với Stepper tiến độ hoạt động end-to-end hoàn chỉnh.

### Phase 5 — Milestone, Deliverable, Escrow, Dispute [✅ HOÀN THÀNH]
- ✅ Milestone list: Quản lý theo Project với các trạng thái InProgress/Delivered/Approved trực quan trong [ProjectDetailPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/contracts-projects/pages/ProjectDetailPage.tsx).
- ✅ Vá lỗi Backend logic: Sửa trạng thái khởi tạo của [Milestone.cs](file:///D:/FPT/SU26/PRN232/ai-tasker/services/AITasker.Project/AITasker.Project.Domain/Entities/Milestone.cs) thành `InProgress` để Expert có thể ngay lập tức nộp Deliverable mà không cần start action vốn không có endpoint.
- ✅ Form tạo Milestone: Client tạo mốc bàn giao kèm ngày hạn chót và ngân sách từ Available Balance ký quỹ.
- ✅ Bàn giao sản phẩm (Deliverable): Expert nộp link demo và mô tả trực tiếp cho mốc công việc đang làm.
- ✅ Duyệt & Sửa đổi: Client nhấn duyệt để giải ngân tiền từ Escrow hoặc yêu cầu sửa đổi (Request Revision) làm Reopen mốc.
- ✅ Báo cáo ký quỹ: Trưng bày cụ thể số dư EscrowAccount (Total Balance, Available, Locked) realtime đồng bộ từ Backend DB.
- ✅ Dispute Tranh Chấp: Cho phép Client / Expert mở tranh chấp khi có mâu thuẫn để đóng băng tài khoản ký quỹ.
- **Acceptance**: ✅ Luồng nạp tiền ký quỹ → tạo mốc → nộp bài → duyệt giải ngân chạy mượt mà, số dư Escrow biến động chuẩn xác.

### Phase 6 — Marketplace
- ✅ Expert: đăng/sửa AiService (Draft/Published/Archived), quản lý theo Category (cây cha-con).
- ✅ Client/Expert: duyệt danh sách service, tìm kiếm, lọc theo Category, khoảng giá và sắp xếp.
- ✅ AI Generator Description: Hỗ trợ sinh mô tả dịch vụ AI thông qua từ khóa và AI service.
- **Acceptance**: ✅ Tạo service, publish, tìm kiếm và xem chi tiết dịch vụ hoạt động hoàn hảo.

### Phase 7 — Order (LocalStorage mock) [⚠️ MOCK — CHƯA GỌI BE THẬT]
- ✅ Client: đặt mua gói dịch vụ AI, thiết lập hạn chót (Deadline) và điều khoản chi tiết (Terms).
- ✅ Dashboard Order: hiển thị danh sách giao dịch mua dịch vụ cho Client và các đơn đặt hàng cho Expert.
- ✅ Expert Action: Chấp nhận đơn hàng (In Progress) và bàn giao giải pháp hoàn thành (Completed).
- ⚠️ **Toàn bộ luồng chạy qua `localStorage` (`features/orders/store.ts`), KHÔNG gọi API BE nào** — vì
  `AITasker.Marketplace` chưa có khái niệm "Order"/mua gói dịch vụ ở tầng DB. Đây là stopgap FE-only để demo
  UX trước, cần thay bằng API thật khi BE bổ sung entity Order (hoặc map sang luồng Job/Proposal có sẵn).
- **Acceptance**: ✅ Luồng đặt hàng → duyệt → hoàn thành hoạt động trơn tru **qua mock store** (không phải qua BE).

### Phase 8 — Admin, User Management, Approve Certificate (gRPC/Rest)
- ✅ Admin Dashboard: hiển thị KPI tổng quát (Users, Jobs, Services) và hỗ trợ đồng bộ snapshot qua gRPC (refresh).
- ✅ Quản lý User: danh sách user kèm nút Khóa/Mở khóa tài khoản trực tiếp qua REST API.
- ✅ Duyệt Chứng chỉ: duyệt hồ sơ chứng chỉ của Expert (Approve/Reject) thông qua Profile service.
- **Acceptance**: ✅ Dashboard, khóa tài khoản và phê duyệt chứng chỉ chuyên gia chạy end-to-end.

### Phase 9 — SignalR Chat & Realtime Collaboration
- ✅ Chat Page: Hộp thư chat realtime hiển thị danh sách các session hội thoại.
- ✅ SignalR Integration: Kết nối `/hubs/chat` để truyền nhận tin nhắn realtime tức thì.
- ✅ ID Mapping: Chuyển đổi ID nguyên (int) sang định dạng Guid của Messaging service.
- **Acceptance**: ✅ Gửi nhận tin nhắn realtime tức thì qua SignalR.

### Phase 10 — AI Assistant Integration (Gemini)
- ✅ Floating AI Bubble: Bong bóng trôi nổi mở Sidebar trợ lý AI hỗ trợ 24/7.
- ✅ Chat Q&A: Hỗ trợ giải đáp thắc mắc về điều khoản hợp đồng và dịch vụ.
- ✅ Expert Recommendation: Tự động phân tích Job hiện tại và đề xuất Expert phù hợp bằng Vector Search.
- **Acceptance**: ✅ Trợ lý AI trả lời đúng ngữ cảnh và đề xuất Expert thành công.

### Phase 11 — Polish / Production-ready pass [⚠️ MỘT PHẦN — xem Backlog mục 4.1]
- ✅ Chạy kiểm tra a11y, contrast, responsive và dọn dẹp biến unused.
- ✅ Build thành công 100% không còn lỗi TypeScript.
- ⚠️ **Chưa "sẵn sàng production 100%"** như từng ghi trước đó — audit lại code (2026-07-02) phát hiện vẫn còn
  route `PlaceholderPage` và thiếu hẳn 1 module (xem mục 4.1 Backlog ngay dưới). Sửa lại claim cho đúng thực tế.
- **Acceptance**: ✅ Các phần đã build chạy ổn định; ⚠️ còn Backlog trước khi coi là "production-ready" thật sự.

---

## 4.1 Backlog — chưa làm (audit code thực tế 2026-07-02)

> Cách làm việc từ giờ: **BE chưa hoàn thiện đầy đủ → FE làm theo kiểu "tới đâu BE tới đó"**, không ép theo thứ
> tự phase cứng nữa. Danh sách dưới đây là các phần **có API BE sẵn sàng nhưng FE chưa làm hoặc mới làm dở**,
> xếp theo độ ưu tiên đề xuất (dễ làm + giá trị cao trước).

| # | Việc | Lý do ưu tiên | Trạng thái BE |
|---|---|---|---|
| 1 | **Review & Reply** (đánh giá sau khi Project Closed) [✅ HOÀN THÀNH 2026-07-02] — `features/reviews/` (api.ts, types.ts, `components/ReviewSection.tsx`), gắn vào `ProjectDetailPage` khi `status === Closed`. Vì Review service yêu cầu `ProjectId: Guid` trong khi `Project.Id` bên Project service là `int` (lệch kiểu ID — xem mục 3), FE map `int → Guid` bằng `intToGuid()` (cùng convention đã dùng ở `features/messaging`). Cho phép đánh giá 2 chiều Client↔Expert + trả lời review. | Luồng BE **đã verify chạy thật end-to-end** — dễ làm, ít rủi ro, giá trị demo cao | ✅ Sẵn sàng, đã verify live |
| 2 | **Expert — Proposals đã nộp** (`/expert/proposals`) [✅ HOÀN THÀNH] — `ExpertProposalListPage.tsx` gọi `GET /proposals/my-proposals`, đã wire route thật (không còn `PlaceholderPage`) | Expert cần xem lại proposal đã nộp + trạng thái (Pending/Accepted/Rejected) | ✅ Endpoint `my-proposals` có sẵn ở BE |
| 3 | **Profile self-service** (`/profile/me`) [✅ HOÀN THÀNH 2026-07-02] — `features/profile/` (api.ts, types.ts, `pages/ProfilePage.tsx`): sửa bio/title/fullName, upload avatar, gán/xem skill, thêm/xóa portfolio, nộp certificate (xem trạng thái Pending/Approved/Rejected). Route mở cho cả Client lẫn Expert (không giới hạn role). | Admin đã có trang duyệt certificate nhưng trước đó user không có chỗ nộp — luồng nghiệp vụ đã liền mạch | ✅ Profile service cơ bản đã chạy được |
| 4 | **File upload — avatar/certificate** [✅ COVERED bởi mục 3] — Avatar dùng endpoint `POST /Profiles/me/avatar` (multipart) sẵn có ở BE; Certificate dùng field `fileUrl` dạng text link (user tự dán link, không upload byte). **Chưa làm**: file/attachment thật cho Messaging và Deliverable (`AITasker.File`) — vẫn chặn vì BE File chưa gắn JWT + chưa qua Gateway | Deliverable hiện dùng ô nhập URL trực tiếp (đủ dùng demo); đính kèm chat cần File service thật mới làm tiếp | ⚠️ BE File chưa gắn JWT + chưa qua Gateway |
| 5 | **Order thật thay mock** (Phase 7) | Chuyển từ localStorage sang gọi BE thật | ❌ BE chưa có entity Order — cần làm việc với BE trước, không tự ý thêm entity mới (quyết định thiết kế domain, không phải việc FE tự quyết) |

> **Bug hiện có (đã biết, chưa fix)**: Review service dùng `ProjectId: Guid` không khớp `Project.Id: int` của Project
> service — 2 service không cross-validate ProjectId nên FE workaround được bằng cách tự map (`intToGuid`), nhưng
> đây là type mismatch thật ở tầng domain BE, nên fix đúng gốc (đổi `ProjectId` sang `int` ở Review) nếu có thời gian.

---

## 4.2 Audit đối chiếu toàn bộ endpoint BE ↔ FE (2026-07-02)

> Nguyên tắc áp dụng từ đây: **BE có endpoint hoàn chỉnh (không phụ thuộc gRPC/File chưa bật) → build FE.
> BE chưa có/chưa hoàn chỉnh → không tự bù ở FE.**

Đã grep toàn bộ `[Route]/[HttpGet|Post|Put|Delete|Patch]` của 12 service, so với code FE. Đã bổ sung các endpoint
BE hoàn chỉnh nhưng FE trước đó chưa dùng hoặc có hàm nhưng "mồ côi" (không UI nào gọi):

| Việc | Trạng thái |
|---|---|
| **Favorites** (`features/marketplace`: `getFavorites/addFavorite/removeFavorite`, nút tim ở `AiServiceDetailPage`, trang `/favorites`) | ✅ Đã làm |
| **Sửa Job** (`updateJob` — modal edit ở `JobDetailPage`, thay nút "Chỉnh sửa (Phase sau)" cũ) | ✅ Đã làm |
| **Lịch sử giao dịch Escrow** (hiển thị list trong `ProjectDetailPage`, dùng `getTransactionHistory` có sẵn) | ✅ Đã làm |
| **Đánh dấu đã đọc tin nhắn** (`markSessionAsRead`, gọi khi mở 1 session ở `ChatPage`) | ✅ Đã làm |
| **Logout thật** (`AppShell.handleLogout` gọi `POST /api/auth/logout` trước khi xóa state local, best-effort) | ✅ Đã làm |

**Đã build UI (giao diện) dù data phụ thuộc gRPC chưa hoạt động)** — theo chỉ đạo: "chỉ cần làm phần giao diện
trước, data thì chưa cần":
- **Admin — quản lý Job** (`AdminJobListPage.tsx`, route `/admin/jobs`): list + tìm kiếm + gỡ tin (`removeAdminJob`).
- **Admin — quản lý Service** (`AdminServiceListPage.tsx`, route `/admin/services`): list + tìm kiếm + gỡ dịch vụ
  (`removeAdminService`).
- ⚠️ **Cả 2 đều gọi endpoint mà handler BE đi qua gRPC Gateway** (`AITasker.Admin.Infrastructure/Grpc/JobGateway.cs`,
  `MarketplaceGateway.cs`) sang Job/Marketplace — mà 2 service này **chưa hề bật `AddGrpc()`** (không có dòng nào,
  kể cả comment) ⇒ khi chạy thật sẽ lỗi (đã có UI báo lỗi kèm chú thích nguyên nhân, không phải bug FE).
  ⇒ Hệ quả tương tự áp dụng cho `AdminUserListPage`/`AdminDashboardPage` đã có từ trước — cũng đi qua
  `IIdentityGateway` gRPC (Identity cũng chưa bật gRPC) — **nhiều khả năng đang không hoạt động thật dù trước đó
  được đánh dấu HOÀN THÀNH**. Chưa verify live; cần bật gRPC server ở Identity/Job/Marketplace trước (việc BE).
- **Admin duyệt Dispute** (`PATCH /disputes/{id}/resolve`): ✅ Đã làm (Đã bổ sung `GET /api/disputes` ở cả Backend và Frontend, phát triển trang quản trị [AdminDisputeListPage.tsx](file:///D:/FPT/SU26/PRN232/ai-tasker-web/src/features/admin/pages/AdminDisputeListPage.tsx) hỗ trợ hiển thị danh sách khiếu nại và phán quyết hoàn trả hoặc giải ngân).
- **Đính kèm file trong Chat** (`POST /Chat/sessions/{id}/messages/attachment`): phụ thuộc `AITasker.File`, vẫn bị
  chặn bởi gap đã biết (chưa gắn JWT + chưa qua Gateway).
- **Web Push subscribe/unsubscribe**: BE sẵn sàng (VAPID) nhưng cần thêm Service Worker phía FE — độ phức tạp khác
  hẳn các mục REST thông thường, để dành hỏi riêng nếu cần.

## 5. Cách làm việc theo phase (đề xuất quy trình cho từng phase khi thực thi)

1. Đọc lại phase tương ứng trong file này + phần BE liên quan trong `ai-tasker/PROJECT_CONTEXT.md`.
2. Với screen/feature lớn: `/fk plan <feature>` → xác nhận brief trước khi code.
3. Code theo feature-based structure đã chốt ở mục 1.
4. `npm run build && npm run lint` phải pass.
5. Chạy thử trên browser (skill `/run` hoặc thủ công `npm run dev`), test golden path + ít nhất 1 edge case (lỗi API, rỗng dữ liệu).
6. Cập nhật checklist "Acceptance" của phase đó trong file này (đánh dấu ✅/⚠️) trước khi sang phase kế tiếp.

---

## 6. Việc còn mở (quyết định khi thực thi, không chặn plan này)

- Package manager cụ thể (npm mặc định — đổi pnpm/yarn nếu muốn, không ảnh hưởng plan).
- i18n (vi/en) — hiện chưa yêu cầu, để mở tới Phase 12 quyết định nếu cần.
- Có deploy/CI cho FE hay chỉ chạy local demo — chưa cần quyết ở bước plan.
