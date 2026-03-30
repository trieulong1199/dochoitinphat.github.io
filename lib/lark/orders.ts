import { larkClient, LARK_CONFIG } from './client'
import type { Order, OrderItem } from '@prisma/client'

// Bảng Đơn hàng trong Lark Base (sẽ cấu hình sau khi tạo bảng)
const LARK_TABLE_ORDERS = process.env.LARK_TABLE_ORDERS || ''

export async function writeLarkOrder(
  order: Order & { items: OrderItem[]; user: { companyName: string; phone?: string | null } }
): Promise<string | null> {
  if (!LARK_TABLE_ORDERS) {
    console.warn('[Lark] LARK_TABLE_ORDERS chưa được cấu hình, bỏ qua ghi Lark')
    return null
  }

  try {
    const res = await larkClient.bitable.appTableRecord.create({
      path: {
        app_token: LARK_CONFIG.appToken,
        table_id: LARK_TABLE_ORDERS,
      },
      data: {
        fields: {
          'Mã đơn': order.orderCode,
          'Đại lý': order.user.companyName,
          'SĐT': order.user.phone || '',
          'Tổng tiền': order.totalAmount,
          'Ghi chú': order.note || '',
          'Trạng thái': order.status,
          'Ngày đặt': order.createdAt.toISOString(),
          'Chi tiết': order.items
            .map((i) => `${i.sku} - ${i.name}: ${i.soLuongThung} thùng`)
            .join('\n'),
        },
      },
    })

    return res.data?.record?.record_id || null
  } catch (err) {
    console.error('[Lark] Lỗi ghi đơn hàng:', err)
    return null
  }
}
