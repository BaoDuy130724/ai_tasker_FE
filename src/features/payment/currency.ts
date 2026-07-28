/**
 * Ví và PayOS làm việc bằng VND — các mốc của BE nói rõ điều đó (tối thiểu 2.000,
 * tối đa 500.000.000). Dùng chung một hàm để mọi màn tiền hiển thị giống nhau.
 *
 * ⚠️ Escrow bên features/contracts-projects vẫn đang in "$ USD" cho CÙNG những con số
 * này (BE đối chiếu ví ↔ escrow 1:1, không quy đổi). Đó là lệch nhãn có sẵn từ trước,
 * không phải do màn ví — cần cả team chốt một đơn vị rồi sửa một lượt.
 */
export const formatVnd = (amount: number): string => `${amount.toLocaleString("vi-VN")} ₫`

/** Chỉ tách hàng nghìn, KHÔNG gắn đơn vị — dùng ở nơi đang lẫn hai cách ghi tiền. */
export const formatAmount = (amount: number): string => amount.toLocaleString("vi-VN")

export const formatDateTime = (value: string): string => new Date(value).toLocaleString("vi-VN")
