/**
 * ============================================================================
 *  MOCK DATA — seed cho toàn bộ service (trừ identity & gateway)
 * ============================================================================
 *  Mỗi entity khớp ĐÚNG field mà FE dùng (xem src/features/<feature>/types.ts
 *  & api.ts). Các mảng là `let`/mutable để mutation (create/lock/read...) phản
 *  ánh ngay trên UI trong phiên chạy.
 * ============================================================================
 */
import { intToGuid, daysFromNow } from "./lib"

/* ------------------------------------------------------------------ */
/*  Danh bạ người dùng (dùng chung cho tên/avatar xuyên suốt service)  */
/* ------------------------------------------------------------------ */
export interface Person {
  userId: number
  fullName: string
  email: string
  role: "Client" | "Expert" | "Admin"
  avatar: string
  title: string
}

const av = (n: number) => `https://i.pravatar.cc/150?img=${n}`

export const people: Person[] = [
  { userId: 1001, fullName: "Nguyễn Minh Anh", email: "minhanh@client.io", role: "Client", avatar: av(32), title: "Founder @ FinAI Startup" },
  { userId: 1002, fullName: "Trần Thu Hà", email: "thuha@client.io", role: "Client", avatar: av(45), title: "Product Manager @ EduTech" },
  { userId: 1003, fullName: "Hoàng Gia Bảo", email: "giabao@client.io", role: "Client", avatar: av(15), title: "CTO @ RetailX" },
  { userId: 2001, fullName: "Lê Hoàng Nam", email: "hoangnam@expert.io", role: "Expert", avatar: av(12), title: "Senior ML Engineer" },
  { userId: 2002, fullName: "Phạm Quốc Bảo", email: "quocbao@expert.io", role: "Expert", avatar: av(51), title: "LLM / RAG Specialist" },
  { userId: 2003, fullName: "Đỗ Thùy Linh", email: "thuylinh@expert.io", role: "Expert", avatar: av(47), title: "Computer Vision Engineer" },
  { userId: 2004, fullName: "Vũ Đình Khoa", email: "dinhkhoa@expert.io", role: "Expert", avatar: av(68), title: "Data Engineer & MLOps" },
  { userId: 9001, fullName: "Quản trị viên", email: "admin@aitasker.io", role: "Admin", avatar: av(60), title: "Platform Administrator" },
]

export const findPerson = (userId: number): Person =>
  people.find((p) => p.userId === userId) || {
    userId,
    fullName: `Người dùng #${userId}`,
    email: `user${userId}@aitasker.io`,
    role: "Client",
    avatar: av(1),
    title: "Thành viên",
  }

const SKILL_POOL = [
  "React", "Node.js", "Python", "Machine Learning", "LLM / RAG", "Computer Vision",
  "Data Engineering", "UI/UX", "DevOps / MLOps", "NLP", "TypeScript", "PyTorch",
]

/* ============================== JOB SERVICE ============================== */
// Job (src/features/jobs/types.ts): status 0=Open, 1=Closed
export interface MockJob {
  id: number; title: string; description: string; budget: number; deadline: string
  skills: string[]; status: number; statusName: string; clientId: number
  createdAt: string; updatedAt: string | null
}

export let jobs: MockJob[] = [
  {
    id: 1, clientId: 1001, status: 0, statusName: "Open",
    title: "Xây dựng chatbot RAG hỏi đáp tài liệu nội bộ",
    description: "Cần expert xây dựng chatbot dùng LLM + RAG truy vấn kho tài liệu PDF nội bộ (~5000 trang). Yêu cầu: pipeline embedding, vector DB (Qdrant/pgvector), API FastAPI, độ trễ < 2s, trích dẫn nguồn.",
    budget: 25_000_000, deadline: daysFromNow(30),
    skills: ["Python", "LLM / RAG", "NLP"], createdAt: daysFromNow(-5), updatedAt: null,
  },
  {
    id: 2, clientId: 1002, status: 0, statusName: "Open",
    title: "Hệ thống chấm điểm bài luận tự động bằng AI",
    description: "Ứng dụng EdTech cần module chấm điểm bài luận tiếng Anh theo rubric IELTS, feedback chi tiết. Tích hợp REST API, có dashboard theo dõi tiến bộ học viên.",
    budget: 40_000_000, deadline: daysFromNow(45),
    skills: ["Machine Learning", "NLP", "Python"], createdAt: daysFromNow(-8), updatedAt: daysFromNow(-2),
  },
  {
    id: 3, clientId: 1001, status: 0, statusName: "Open",
    title: "Nhận diện sản phẩm lỗi trên dây chuyền (Computer Vision)",
    description: "Camera công nghiệp, cần model phát hiện lỗi bề mặt real-time (>= 30 FPS) trên edge device Jetson. Bao gồm gán nhãn dữ liệu, huấn luyện, đóng gói TensorRT.",
    budget: 60_000_000, deadline: daysFromNow(60),
    skills: ["Computer Vision", "PyTorch", "DevOps / MLOps"], createdAt: daysFromNow(-3), updatedAt: null,
  },
  {
    id: 4, clientId: 1003, status: 0, statusName: "Open",
    title: "Gợi ý sản phẩm cá nhân hoá cho sàn TMĐT",
    description: "Xây recommender system (collaborative + content-based) cho ~500k sản phẩm, phục vụ realtime qua feature store. A/B test tăng CTR.",
    budget: 55_000_000, deadline: daysFromNow(50),
    skills: ["Machine Learning", "Data Engineering", "Python"], createdAt: daysFromNow(-12), updatedAt: null,
  },
  {
    id: 5, clientId: 1002, status: 1, statusName: "Closed",
    title: "Trợ lý giọng nói tiếng Việt cho app ngân hàng",
    description: "STT + intent detection tiếng Việt, tích hợp vào app mobile. (Đã tuyển được expert)",
    budget: 35_000_000, deadline: daysFromNow(-10),
    skills: ["NLP", "Python", "Machine Learning"], createdAt: daysFromNow(-40), updatedAt: daysFromNow(-15),
  },
  {
    id: 6, clientId: 1003, status: 0, statusName: "Open",
    title: "Pipeline ETL + data warehouse cho báo cáo BI",
    description: "Dựng pipeline Airflow ingest dữ liệu từ nhiều nguồn về warehouse (BigQuery), mô hình dimensional, kết nối Power BI.",
    budget: 30_000_000, deadline: daysFromNow(35),
    skills: ["Data Engineering", "Python", "DevOps / MLOps"], createdAt: daysFromNow(-1), updatedAt: null,
  },
  {
    id: 7, clientId: 1001, status: 0, statusName: "Open",
    title: "Tóm tắt & phân loại email hỗ trợ khách hàng",
    description: "Model phân loại ticket + tóm tắt hội thoại, tích hợp Zendesk. Cần fine-tune trên dữ liệu tiếng Việt.",
    budget: 22_000_000, deadline: daysFromNow(28),
    skills: ["NLP", "LLM / RAG", "Python"], createdAt: daysFromNow(-6), updatedAt: null,
  },
  {
    id: 8, clientId: 1002, status: 1, statusName: "Closed",
    title: "Dashboard phân tích cảm xúc mạng xã hội",
    description: "Thu thập & phân tích sentiment bài đăng, trực quan hoá theo thời gian thực.",
    budget: 18_000_000, deadline: daysFromNow(-20),
    skills: ["NLP", "React", "Data Engineering"], createdAt: daysFromNow(-55), updatedAt: daysFromNow(-25),
  },
]

/* ============================ PROJECT SERVICE ============================ */
// Proposal (proposals/types.ts): status 0=Pending,1=Accepted,2=Rejected
export interface MockProposal {
  id: number; jobId: number; expertId: number; proposedPrice: number
  estimatedDays: number; description: string; status: number; createdAt: string
}

export let proposals: MockProposal[] = [
  { id: 101, jobId: 1, expertId: 2002, proposedPrice: 24_000_000, estimatedDays: 28, status: 1, createdAt: daysFromNow(-4), description: "Tôi đã triển khai 5+ hệ thống RAG production. Đề xuất Qdrant + hybrid search + reranker để đạt độ chính xác cao, có trích dẫn nguồn." },
  { id: 102, jobId: 1, expertId: 2001, proposedPrice: 27_500_000, estimatedDays: 30, status: 0, createdAt: daysFromNow(-3), description: "Kinh nghiệm LLMOps, sẽ dùng LangGraph + pgvector, kèm eval harness đo hallucination." },
  { id: 103, jobId: 2, expertId: 2001, proposedPrice: 38_000_000, estimatedDays: 40, status: 0, createdAt: daysFromNow(-6), description: "Đề xuất mô hình chấm điểm đa tiêu chí theo rubric IELTS, feedback theo band descriptors." },
  { id: 104, jobId: 3, expertId: 2003, proposedPrice: 58_000_000, estimatedDays: 55, status: 0, createdAt: daysFromNow(-2), description: "Chuyên CV công nghiệp, YOLOv8 + TensorRT trên Jetson Orin, đảm bảo 30+ FPS." },
  { id: 105, jobId: 4, expertId: 2004, proposedPrice: 52_000_000, estimatedDays: 48, status: 0, createdAt: daysFromNow(-10), description: "Xây recommender lai với Feast feature store, phục vụ realtime qua Redis." },
  { id: 106, jobId: 5, expertId: 2002, proposedPrice: 33_000_000, estimatedDays: 35, status: 1, createdAt: daysFromNow(-38), description: "STT tiếng Việt fine-tune Whisper, intent detection dùng PhoBERT." },
  { id: 107, jobId: 7, expertId: 2001, proposedPrice: 21_000_000, estimatedDays: 26, status: 0, createdAt: daysFromNow(-5), description: "Fine-tune model phân loại + tóm tắt, tích hợp webhook Zendesk." },
]

// Contract (contracts-projects/types.ts)
export interface MockContract {
  id: number; proposalId: number; clientId: number; expertId: number; terms: string; signedAt: string
}
export let contracts: MockContract[] = [
  { id: 501, proposalId: 101, clientId: 1001, expertId: 2002, terms: "Bàn giao theo 3 milestone, thanh toán qua Escrow. Bảo mật mã nguồn & dữ liệu. Bảo hành 30 ngày.", signedAt: daysFromNow(-4) },
  { id: 502, proposalId: 106, clientId: 1002, expertId: 2002, terms: "Bàn giao theo 2 milestone. Nghiệm thu theo bộ test tiếng Việt do Client cung cấp.", signedAt: daysFromNow(-37) },
]

// Project = ProjectDetailsDto (contracts-projects/types.ts): status 0..4
export interface MockProject {
  id: number; contractId: number; status: number; statusName: string
  createdAt: string; updatedAt: string; jobId: number; proposedPrice: number
  clientId: number; expertId: number
  escrowTotalBalance: number; escrowAvailableBalance: number; escrowLockedBalance: number
}
const PROJECT_STATUS = ["Created", "InProgress", "Delivered", "Approved", "Closed"]
export let projects: MockProject[] = [
  {
    id: 701, contractId: 501, status: 1, statusName: "InProgress",
    createdAt: daysFromNow(-4), updatedAt: daysFromNow(-1), jobId: 1, proposedPrice: 24_000_000,
    clientId: 1001, expertId: 2002,
    escrowTotalBalance: 24_000_000, escrowAvailableBalance: 8_000_000, escrowLockedBalance: 16_000_000,
  },
  {
    id: 702, contractId: 502, status: 4, statusName: "Closed",
    createdAt: daysFromNow(-37), updatedAt: daysFromNow(-14), jobId: 5, proposedPrice: 33_000_000,
    clientId: 1002, expertId: 2002,
    escrowTotalBalance: 33_000_000, escrowAvailableBalance: 0, escrowLockedBalance: 0,
  },
]

// Milestone (contracts-projects/types.ts): status 0=Pending,1=InProgress,2=Delivered,3=Approved
export interface MockMilestone {
  id: number; projectId: number; title: string; description: string
  dueDate: string; amount: number; status: number; statusName: string
}
const MILESTONE_STATUS = ["Pending", "InProgress", "Delivered", "Approved"]
export let milestones: MockMilestone[] = [
  { id: 801, projectId: 701, title: "M1 — Pipeline embedding & vector DB", description: "Dựng pipeline ingest tài liệu, embedding, nạp vào Qdrant, API search cơ bản.", dueDate: daysFromNow(-1), amount: 8_000_000, status: 3, statusName: "Approved" },
  { id: 802, projectId: 701, title: "M2 — Chatbot RAG + trích dẫn nguồn", description: "Ghép LLM sinh câu trả lời có trích dẫn, reranker, độ trễ < 2s.", dueDate: daysFromNow(12), amount: 8_000_000, status: 1, statusName: "InProgress" },
  { id: 803, projectId: 701, title: "M3 — Đóng gói & bàn giao", description: "Docker hoá, tài liệu vận hành, bàn giao & nghiệm thu.", dueDate: daysFromNow(26), amount: 8_000_000, status: 0, statusName: "Pending" },
  { id: 811, projectId: 702, title: "M1 — STT tiếng Việt", description: "Fine-tune Whisper, WER < 12%.", dueDate: daysFromNow(-30), amount: 16_500_000, status: 3, statusName: "Approved" },
  { id: 812, projectId: 702, title: "M2 — Intent detection & tích hợp", description: "PhoBERT intent, tích hợp SDK app.", dueDate: daysFromNow(-16), amount: 16_500_000, status: 3, statusName: "Approved" },
]

// EscrowTransaction (contracts-projects/api.ts): escrowAccountId == projectId để lọc theo projectId
export interface MockEscrowTx {
  id: number; escrowAccountId: number; type: number; typeName: string; amount: number
  status: number; statusName: string; idempotencyKey: string; createdAt: string
}
export let escrowTxns: MockEscrowTx[] = [
  { id: 9001, escrowAccountId: 701, type: 0, typeName: "Deposit", amount: 24_000_000, status: 1, statusName: "Completed", idempotencyKey: "seed-dep-701", createdAt: daysFromNow(-4) },
  { id: 9002, escrowAccountId: 701, type: 1, typeName: "Lock", amount: 8_000_000, status: 1, statusName: "Completed", idempotencyKey: "seed-lock-701-1", createdAt: daysFromNow(-4) },
  { id: 9003, escrowAccountId: 701, type: 2, typeName: "Release", amount: 8_000_000, status: 1, statusName: "Completed", idempotencyKey: "seed-rel-701-1", createdAt: daysFromNow(-1) },
  { id: 9004, escrowAccountId: 701, type: 1, typeName: "Lock", amount: 8_000_000, status: 1, statusName: "Completed", idempotencyKey: "seed-lock-701-2", createdAt: daysFromNow(-1) },
  { id: 9010, escrowAccountId: 702, type: 0, typeName: "Deposit", amount: 33_000_000, status: 1, statusName: "Completed", idempotencyKey: "seed-dep-702", createdAt: daysFromNow(-37) },
  { id: 9011, escrowAccountId: 702, type: 2, typeName: "Release", amount: 33_000_000, status: 1, statusName: "Completed", idempotencyKey: "seed-rel-702", createdAt: daysFromNow(-14) },
]

// Dispute (contracts-projects/api.ts): status 0=Open,1=UnderReview,2=Resolved
export interface MockDispute {
  id: number; projectId: number; openedBy: number; openerRole: string; description: string
  evidenceFileUrl: string | null; status: number; statusName: string
  resolution: number | null; resolvedBy: number | null; resolvedAt: string | null
}
export let disputes: MockDispute[] = [
  { id: 601, projectId: 701, openedBy: 1001, openerRole: "Client", description: "Milestone 2 bàn giao chậm so với cam kết, cần đối chiếu lại tiến độ.", evidenceFileUrl: null, status: 1, statusName: "UnderReview", resolution: null, resolvedBy: null, resolvedAt: null },
  { id: 602, projectId: 702, openedBy: 2002, openerRole: "Expert", description: "Client yêu cầu chỉnh sửa ngoài phạm vi hợp đồng.", evidenceFileUrl: "https://picsum.photos/seed/evidence/600/400", status: 2, statusName: "Resolved", resolution: 1, resolvedBy: 9001, resolvedAt: daysFromNow(-15) },
]

/* ========================== MARKETPLACE SERVICE ========================= */
// AiService (marketplace/types.ts): dùng rating & reviewsCount (không phải averageRating)
export interface MockAiService {
  id: number; expertId: number; categoryId: number; categoryName?: string
  title: string; description: string; price: number; deliveryTimeDays: number
  coverImageUrl: string | null; status: string; skills: string[]
  rating: number; reviewsCount: number; createdAt: string; updatedAt: string | null
}
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`

export let categories: { id: number; name: string; description: string | null; parentId: number | null }[] = [
  { id: 1, name: "Chatbot & LLM", description: "Trợ lý ảo, RAG, fine-tuning", parentId: null },
  { id: 2, name: "Computer Vision", description: "Nhận diện ảnh, video, OCR", parentId: null },
  { id: 3, name: "Data & Analytics", description: "ETL, dashboard, dự báo", parentId: null },
  { id: 4, name: "NLP", description: "Xử lý ngôn ngữ tự nhiên", parentId: 1 },
  { id: 5, name: "MLOps", description: "Triển khai & vận hành mô hình", parentId: null },
  { id: 6, name: "Recommender", description: "Hệ gợi ý cá nhân hoá", parentId: 3 },
]

export let services: MockAiService[] = [
  { id: 11, expertId: 2002, categoryId: 1, categoryName: "Chatbot & LLM", title: "Xây dựng Chatbot RAG doanh nghiệp", description: "Trợ lý AI truy vấn tài liệu nội bộ với trích dẫn nguồn, chống hallucination, tích hợp Slack/Web.", price: 12_000_000, deliveryTimeDays: 14, coverImageUrl: cover("rag"), status: "Published", skills: ["LLM / RAG", "Python", "NLP"], rating: 4.9, reviewsCount: 27, createdAt: daysFromNow(-20), updatedAt: daysFromNow(-3) },
  { id: 12, expertId: 2001, categoryId: 1, categoryName: "Chatbot & LLM", title: "Fine-tune LLM cho lĩnh vực chuyên ngành", description: "LoRA/QLoRA fine-tuning, xây dataset, eval harness, tối ưu chi phí inference.", price: 18_000_000, deliveryTimeDays: 21, coverImageUrl: cover("finetune"), status: "Published", skills: ["Machine Learning", "PyTorch", "LLM / RAG"], rating: 4.8, reviewsCount: 19, createdAt: daysFromNow(-28), updatedAt: null },
  { id: 13, expertId: 2003, categoryId: 2, categoryName: "Computer Vision", title: "Model nhận diện lỗi sản phẩm real-time", description: "Phát hiện lỗi bề mặt trên dây chuyền, tối ưu TensorRT chạy edge 30+ FPS.", price: 22_000_000, deliveryTimeDays: 25, coverImageUrl: cover("defect"), status: "Published", skills: ["Computer Vision", "PyTorch"], rating: 5.0, reviewsCount: 12, createdAt: daysFromNow(-15), updatedAt: null },
  { id: 14, expertId: 2003, categoryId: 2, categoryName: "Computer Vision", title: "OCR trích xuất hoá đơn / chứng từ tiếng Việt", description: "Nhận dạng & bóc tách trường thông tin hoá đơn, độ chính xác > 95%.", price: 9_500_000, deliveryTimeDays: 12, coverImageUrl: cover("ocr"), status: "Published", skills: ["Computer Vision", "NLP"], rating: 4.7, reviewsCount: 33, createdAt: daysFromNow(-9), updatedAt: null },
  { id: 15, expertId: 2004, categoryId: 3, categoryName: "Data & Analytics", title: "Dựng pipeline ETL + Data Warehouse", description: "Airflow + dbt + BigQuery, mô hình dimensional, kết nối Power BI/Looker.", price: 15_000_000, deliveryTimeDays: 18, coverImageUrl: cover("etl"), status: "Published", skills: ["Data Engineering", "Python"], rating: 4.6, reviewsCount: 21, createdAt: daysFromNow(-22), updatedAt: null },
  { id: 16, expertId: 2004, categoryId: 6, categoryName: "Recommender", title: "Hệ gợi ý sản phẩm cá nhân hoá", description: "Recommender lai realtime với feature store, tối ưu CTR qua A/B test.", price: 20_000_000, deliveryTimeDays: 24, coverImageUrl: cover("recsys"), status: "Published", skills: ["Machine Learning", "Data Engineering"], rating: 4.8, reviewsCount: 8, createdAt: daysFromNow(-6), updatedAt: null },
  { id: 17, expertId: 2001, categoryId: 4, categoryName: "NLP", title: "Phân loại & tóm tắt văn bản tiếng Việt", description: "Fine-tune PhoBERT phân loại ticket + tóm tắt hội thoại, tích hợp API.", price: 8_000_000, deliveryTimeDays: 10, coverImageUrl: cover("nlp"), status: "Published", skills: ["NLP", "Python"], rating: 4.9, reviewsCount: 41, createdAt: daysFromNow(-30), updatedAt: null },
  { id: 18, expertId: 2002, categoryId: 5, categoryName: "MLOps", title: "Triển khai & vận hành mô hình (MLOps)", description: "CI/CD cho model, monitoring drift, autoscaling, giảm chi phí GPU.", price: 16_000_000, deliveryTimeDays: 20, coverImageUrl: cover("mlops"), status: "Draft", skills: ["DevOps / MLOps", "Python"], rating: 4.5, reviewsCount: 5, createdAt: daysFromNow(-2), updatedAt: null },
]

// Favorite (marketplace/types.ts)
export interface MockFavorite {
  id: number; clientId: number; serviceId: number; createdAt: string; service: MockAiService
}
export let favorites: MockFavorite[] = [
  { id: 1, clientId: 1001, serviceId: 13, createdAt: daysFromNow(-4), service: services.find((s) => s.id === 13)! },
  { id: 2, clientId: 1001, serviceId: 17, createdAt: daysFromNow(-2), service: services.find((s) => s.id === 17)! },
]

/* ============================= REVIEW SERVICE =========================== */
// Review (reviews/types.ts): id & projectId là Guid string
export interface MockReview {
  id: string; projectId: string; reviewerId: number; revieweeId: number
  rating: number; comment: string | null; createdAt: string
  reply: { id: string; reviewId: string; replierId: number; content: string; createdAt: string } | null
}
export let reviews: MockReview[] = [
  { id: intToGuid(1), projectId: intToGuid(702), reviewerId: 1002, revieweeId: 2002, rating: 5, comment: "Expert cực kỳ chuyên nghiệp, chatbot chạy mượt và đúng yêu cầu. Sẽ hợp tác tiếp!", createdAt: daysFromNow(-13), reply: { id: intToGuid(1001), reviewId: intToGuid(1), replierId: 2002, content: "Cảm ơn chị Hà rất nhiều, rất vui được đồng hành cùng dự án!", createdAt: daysFromNow(-12) } },
  { id: intToGuid(2), projectId: intToGuid(650), reviewerId: 1001, revieweeId: 2003, rating: 5, comment: "Độ chính xác model vượt kỳ vọng, bàn giao đúng hạn.", createdAt: daysFromNow(-25), reply: null },
  { id: intToGuid(3), projectId: intToGuid(651), reviewerId: 1003, revieweeId: 2004, rating: 4, comment: "Pipeline ổn định, tài liệu rõ ràng. Trừ 1 sao vì hơi trễ 2 ngày.", createdAt: daysFromNow(-30), reply: { id: intToGuid(1002), reviewId: intToGuid(3), replierId: 2004, content: "Cảm ơn anh đã góp ý, em sẽ cải thiện khâu ước lượng thời gian!", createdAt: daysFromNow(-29) } },
  { id: intToGuid(4), projectId: intToGuid(652), reviewerId: 1002, revieweeId: 2001, rating: 5, comment: "Kiến thức sâu, tư vấn tận tình.", createdAt: daysFromNow(-40), reply: null },
  { id: intToGuid(5), projectId: intToGuid(653), reviewerId: 1001, revieweeId: 2002, rating: 4, comment: "Kết quả tốt, giao tiếp nhanh.", createdAt: daysFromNow(-50), reply: null },
]

/* ========================== NOTIFICATION SERVICE ======================= */
// Notification (notifications/types.ts) — userId sẽ được stamp theo user hiện tại ở handler
export interface MockNotification {
  id: number; userId: number; title: string; message: string; eventType: string
  actionUrl: string | null; isRead: boolean; createdAt: string
}
export const notificationSeed = (uid: number): MockNotification[] => [
  { id: 1, userId: uid, title: "Đề xuất mới", message: "Expert Phạm Quốc Bảo vừa gửi đề xuất cho job 'Chatbot RAG'.", eventType: "ProposalSubmitted", actionUrl: "/jobs/1", isRead: false, createdAt: daysFromNow(-0.1) },
  { id: 2, userId: uid, title: "Milestone được duyệt", message: "Milestone 'M1 — Pipeline embedding' đã được duyệt và giải ngân.", eventType: "MilestoneApproved", actionUrl: "/projects/701", isRead: false, createdAt: daysFromNow(-1) },
  { id: 3, userId: uid, title: "Tin nhắn mới", message: "Bạn có tin nhắn mới từ Nguyễn Minh Anh.", eventType: "NewMessage", actionUrl: "/messages", isRead: false, createdAt: daysFromNow(-1.5) },
  { id: 4, userId: uid, title: "Ký quỹ thành công", message: "Đã nạp 24.000.000đ vào ví ký quỹ cho dự án #701.", eventType: "EscrowDeposited", actionUrl: "/projects/701", isRead: true, createdAt: daysFromNow(-4) },
  { id: 5, userId: uid, title: "Đánh giá mới", message: "Bạn nhận được đánh giá 5 sao từ Trần Thu Hà.", eventType: "ReviewReceived", actionUrl: "/profile", isRead: true, createdAt: daysFromNow(-13) },
  { id: 6, userId: uid, title: "Tranh chấp đang xử lý", message: "Tranh chấp #601 đang được quản trị viên xem xét.", eventType: "DisputeUnderReview", actionUrl: "/projects/701", isRead: true, createdAt: daysFromNow(-2) },
]

/* =========================== MESSAGING SERVICE ========================== */
// ChatSession / ChatMessage (messaging/types.ts): id là Guid string, senderId Guid
export interface MockChatMessage {
  id: string; sessionId: string; senderId: string; content: string
  createdAt: string; fileUrl?: string | null; fileName?: string | null
}
export interface MockChatSession {
  id: string; clientId: string; expertId: string; jobId: string | null
  createdAt: string; updatedAt: string; lastMessage: MockChatMessage | null
}

const sess1 = intToGuid(70001)
const sess2 = intToGuid(70002)
export let chatMessages: MockChatMessage[] = [
  { id: intToGuid(80001), sessionId: sess1, senderId: intToGuid(1001), content: "Chào bạn, mình quan tâm tới đề xuất chatbot RAG của bạn.", createdAt: daysFromNow(-2) },
  { id: intToGuid(80002), sessionId: sess1, senderId: intToGuid(2002), content: "Chào anh! Cảm ơn anh đã liên hệ. Anh cần chatbot xử lý bao nhiêu tài liệu ạ?", createdAt: daysFromNow(-1.9) },
  { id: intToGuid(80003), sessionId: sess1, senderId: intToGuid(1001), content: "Khoảng 5000 trang PDF, cần có trích dẫn nguồn.", createdAt: daysFromNow(-1.8) },
  { id: intToGuid(80004), sessionId: sess1, senderId: intToGuid(2002), content: "Hoàn toàn khả thi. Mình đề xuất Qdrant + hybrid search, mình gửi báo giá chi tiết nhé.", createdAt: daysFromNow(-1.7) },
  { id: intToGuid(80010), sessionId: sess2, senderId: intToGuid(1002), content: "Bạn ơi model STT chạy tốt rồi, cảm ơn nhiều!", createdAt: daysFromNow(-14) },
  { id: intToGuid(80011), sessionId: sess2, senderId: intToGuid(2002), content: "Dạ cảm ơn chị, có gì cần hỗ trợ chị cứ nhắn ạ.", createdAt: daysFromNow(-13.9) },
]
export let chatSessions: MockChatSession[] = [
  { id: sess1, clientId: intToGuid(1001), expertId: intToGuid(2002), jobId: intToGuid(1), createdAt: daysFromNow(-2), updatedAt: daysFromNow(-1.7), lastMessage: chatMessages[3] },
  { id: sess2, clientId: intToGuid(1002), expertId: intToGuid(2002), jobId: intToGuid(5), createdAt: daysFromNow(-14), updatedAt: daysFromNow(-13.9), lastMessage: chatMessages[5] },
]

/* ============================ PROFILE SERVICE =========================== */
// Skill / PortfolioItem / Certificate / UserProfile (profile/types.ts): id là Guid
export interface MockSkill { id: string; name: string; category: string }
export let skills: MockSkill[] = SKILL_POOL.map((name, i) => ({
  id: intToGuid(3000 + i),
  name,
  category: ["Frontend", "Backend", "AI/ML"][i % 3],
}))

export interface MockCertificate {
  id: string; name: string; fileUrl: string; issuedBy: string; issueDate: string; status: string
}
export interface MockPortfolioItem {
  id: string; title: string; description: string; link: string; imageUrl: string
}
export interface MockUserProfile {
  id: string; userId: number; fullName: string; title: string; bio: string
  avatarUrl: string; role: string
  portfolioItems: MockPortfolioItem[]; skills: MockSkill[]; certificates: MockCertificate[]
}

export const buildProfile = (p: Person): MockUserProfile => ({
  id: intToGuid(p.userId),
  userId: p.userId,
  fullName: p.fullName,
  title: p.title,
  bio: p.role === "Expert"
    ? "Chuyên gia AI với nhiều năm kinh nghiệm triển khai giải pháp production cho doanh nghiệp. Tập trung vào chất lượng, bàn giao đúng hạn và hỗ trợ sau dự án."
    : "Đang tìm kiếm các chuyên gia AI xuất sắc để hiện thực hoá ý tưởng sản phẩm.",
  avatarUrl: p.avatar,
  role: p.role,
  portfolioItems: p.role === "Expert" ? [
    { id: intToGuid(p.userId * 10 + 1), title: "Hệ thống RAG cho ngân hàng", description: "Chatbot tra cứu quy định nội bộ, giảm 60% thời gian tra cứu.", link: "https://example.com/case1", imageUrl: cover(`pf${p.userId}a`) },
    { id: intToGuid(p.userId * 10 + 2), title: "Model dự báo nhu cầu kho vận", description: "Giảm 18% chi phí tồn kho cho chuỗi bán lẻ.", link: "https://example.com/case2", imageUrl: cover(`pf${p.userId}b`) },
  ] : [],
  skills: p.role === "Expert" ? skills.slice(0, 5) : [],
  certificates: p.role === "Expert" ? [
    { id: intToGuid(p.userId * 100 + 1), name: "AWS Certified Machine Learning – Specialty", fileUrl: "https://picsum.photos/seed/cert1/400/300", issuedBy: "Amazon Web Services", issueDate: daysFromNow(-200), status: "Approved" },
    { id: intToGuid(p.userId * 100 + 2), name: "TensorFlow Developer Certificate", fileUrl: "https://picsum.photos/seed/cert2/400/300", issuedBy: "Google", issueDate: daysFromNow(-120), status: "Approved" },
  ] : [],
})

export const profileForUser = (userId: number): MockUserProfile => buildProfile(findPerson(userId))

// Hàng đợi kiểm duyệt chứng chỉ (admin → profile service /AdminCertificates)
export let pendingCertificates: MockCertificate[] = [
  { id: intToGuid(41), name: "Azure AI Engineer Associate", fileUrl: "https://picsum.photos/seed/pc1/400/300", issuedBy: "Microsoft", issueDate: daysFromNow(-30), status: "Pending" },
  { id: intToGuid(42), name: "Deep Learning Specialization", fileUrl: "https://picsum.photos/seed/pc2/400/300", issuedBy: "DeepLearning.AI", issueDate: daysFromNow(-45), status: "Pending" },
  { id: intToGuid(43), name: "Professional Data Engineer", fileUrl: "https://picsum.photos/seed/pc3/400/300", issuedBy: "Google Cloud", issueDate: daysFromNow(-15), status: "Pending" },
]

/* ============================= ADMIN SERVICE =========================== */
// AdminUser (admin/types.ts)
export let adminUsers = people
  .filter((p) => p.role !== "Admin")
  .map((p) => ({ id: p.userId, email: p.email, fullName: p.fullName, role: p.role, isLocked: false }))

// Helpers phái sinh cho admin (AdminJob / AdminService / DashboardKpi)
export const adminJobsView = () =>
  jobs.map((j) => ({ id: j.id, title: j.title, status: j.statusName, ownerUserId: j.clientId }))

export const adminServicesView = () =>
  services.map((s) => ({ id: s.id, title: s.title, price: s.price, expertUserId: s.expertId }))

export const dashboardKpi = () => ({
  totalUsers: adminUsers.length,
  totalJobs: jobs.length,
  totalServices: services.length,
})

/* --------------------- Order seed (localStorage mock) ------------------- */
// Orders vốn đã là mock localStorage sẵn (orders/store.ts, key ai_tasker_mock_orders).
// Seed vào localStorage nếu đang trống để UI Orders có data ngay.
export const orderSeed = () => [
  { id: "ORD-A1B2C3", serviceId: 11, serviceTitle: "Xây dựng Chatbot RAG doanh nghiệp", clientId: 1001, expertId: 2002, price: 12_000_000, terms: "Bàn giao trong 14 ngày, hỗ trợ 30 ngày.", deadline: daysFromNow(14), status: 1, statusName: "In Progress", createdAt: daysFromNow(-3) },
  { id: "ORD-D4E5F6", serviceId: 17, serviceTitle: "Phân loại & tóm tắt văn bản tiếng Việt", clientId: 1001, expertId: 2001, price: 8_000_000, terms: "Bàn giao trong 10 ngày.", deadline: daysFromNow(-2), status: 2, statusName: "Completed", createdAt: daysFromNow(-15) },
  { id: "ORD-G7H8I9", serviceId: 13, serviceTitle: "Model nhận diện lỗi sản phẩm real-time", clientId: 1002, expertId: 2003, price: 22_000_000, terms: "Bàn giao trong 25 ngày.", deadline: daysFromNow(20), status: 0, statusName: "Pending", createdAt: daysFromNow(-1) },
]

export { PROJECT_STATUS, MILESTONE_STATUS }
