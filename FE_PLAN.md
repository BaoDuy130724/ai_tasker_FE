# Kế hoạch phát triển tính năng Frontend (FE_plan.md)

Tài liệu này ghi nhận các tính năng cần phát triển ở Frontend sau khi thống nhất và triển khai các API tương ứng từ phía Backend (BE).

---

## 1. Nguồn tiền & Liên kết thẻ ngân hàng (Payment Method Management)
- **Mô tả:** Cho phép **Client** và **Expert** thêm/quản lý thẻ ngân hàng hoặc phương thức thanh toán trực tuyến làm nguồn nạp tiền (cho Client khi nạp ký quỹ Escrow) hoặc nhận tiền/rút tiền (cho Expert sau khi hoàn thành dự án).
- **Yêu cầu BE phụ thuộc:**
  - API thêm, danh sách và xóa liên kết thẻ ngân hàng / cổng thanh toán (Payment Gateway Integration).
  - API webhook xác thực giao dịch nạp/rút tiền qua thẻ/tài khoản ngân hàng.

---

## 2. Hệ thống Gợi ý Thông minh (Smart Matchmaking System)
- **Mô tả:** 
  - **Dành cho Client:** Gợi ý danh sách các Expert phù hợp nhất dựa trên yêu cầu công việc (kỹ năng, lịch sử đánh giá, mức giá).
  - **Dành cho Expert:** Gợi ý các Job phù hợp nhất với hồ sơ cá nhân, kỹ năng chuyên môn và lịch sử làm việc của Expert.
- **Yêu cầu BE phụ thuộc:**
  - Service/API Gợi ý công việc & Expert (Recommendation System / AI Matching Algorithm).
  - Endpoint lấy danh sách đề xuất cá nhân hóa theo `userId`.

---

> *Ghi chú: Các tính năng này sẽ được triển khai chi tiết trên giao diện FE sau khi làm việc và chốt hợp đồng API với team Backend.*
