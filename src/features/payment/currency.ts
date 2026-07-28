/**
 * Ví và PayOS làm việc bằng VND — các mốc của BE nói rõ điều đó (tối thiểu 2.000,
 * tối đa 500.000.000). Dùng chung một hàm để mọi màn tiền hiển thị giống nhau.
 *
 * Escrow và tất cả các màn hình hiển thị nhất quán bằng VND.
 */
export const formatVnd = (amount: number): string => `${amount.toLocaleString("vi-VN")} ₫`

/** Chỉ tách hàng nghìn, KHÔNG gắn đơn vị — dùng ở nơi đang lẫn hai cách ghi tiền. */
export const formatAmount = (amount: number): string => amount.toLocaleString("vi-VN")

export const formatDateTime = (value: string): string => new Date(value).toLocaleString("vi-VN")
