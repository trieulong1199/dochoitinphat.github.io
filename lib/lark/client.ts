import * as lark from '@larksuiteoapi/node-sdk'
import '@/lib/env' // validate env vars at startup

// ─── Lark Base config ─────────────────────────────────────────────────────────
export const LARK_CONFIG = {
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  appToken: process.env.LARK_APP_TOKEN!,
  tables: {
    products: process.env.LARK_TABLE_PRODUCTS!,
    users: process.env.LARK_TABLE_USERS!,
    orders: process.env.LARK_TABLE_ORDERS!,
    orderItems: process.env.LARK_TABLE_ORDER_ITEMS!,
  },
} as const

// ─── Field name constants ──────────────────────────────────────────────────────
// Tập trung tất cả tên cột Lark ở đây để dễ thay đổi

export const PRODUCT_FIELDS = {
  PRODUCT_ID: 'ID SP',
  SKU: 'SKU',
  NAME: 'Tên hàng',
  QUI_CACH: 'Qui cách',
  GIA_VIP: 'Giá VIP',
  IMAGE: 'Hình ảnh',
} as const

// Bảng Đại lý (Users)
export const USER_FIELDS = {
  USERNAME: 'username',
  PASSWORD: 'password',       // bcrypt hash
  COMPANY_NAME: 'companyName',
  PHONE: 'phone',
  IS_ACTIVE: 'isActive',
} as const

// Bảng Đơn hàng (Orders)
export const ORDER_FIELDS = {
  ORDER_CODE: 'orderCode',
  USER_ID: 'userId',          // recordId của bảng Đại lý
  COMPANY_NAME: 'companyName',
  PHONE: 'phone',
  STATUS: 'status',
  TOTAL_AMOUNT: 'totalAmount',
  NOTE: 'note',
  CREATED_AT: 'createdAt',
} as const

// Bảng Chi tiết đơn hàng (OrderItems)
export const ORDER_ITEM_FIELDS = {
  ORDER_CODE: 'orderCode',
  LARK_SKU_ID: 'larkSkuId',
  SKU: 'sku',
  NAME: 'name',
  QUI_CACH: 'quiCach',
  GIA_VIP: 'giaVip',
  GIA_THUNG: 'giaThung',
  SO_LUONG_THUNG: 'soLuongThung',
  THANH_TIEN: 'thanhTien',
} as const

// ─── Singleton Lark client ────────────────────────────────────────────────────
const globalForLark = globalThis as unknown as {
  larkClient: lark.Client | undefined
}

export const larkClient =
  globalForLark.larkClient ??
  new lark.Client({
    appId: LARK_CONFIG.appId,
    appSecret: LARK_CONFIG.appSecret,
    domain: lark.Domain.Lark,
    loggerLevel:
      process.env.NODE_ENV === 'development'
        ? lark.LoggerLevel.debug
        : lark.LoggerLevel.error,
  })

if (process.env.NODE_ENV !== 'production') globalForLark.larkClient = larkClient

// ─── Helper: list all records with pagination ─────────────────────────────────
export async function listAllRecords(
  tableId: string,
  options?: { filter?: string; pageSize?: number }
): Promise<Array<{ record_id: string; fields: Record<string, unknown> }>> {
  const records: Array<{ record_id: string; fields: Record<string, unknown> }> = []
  let pageToken: string | undefined

  do {
    const res = await larkClient.bitable.appTableRecord.list({
      path: { app_token: LARK_CONFIG.appToken, table_id: tableId },
      params: {
        page_size: options?.pageSize ?? 100,
        filter: options?.filter,
        page_token: pageToken,
      },
    })

    for (const item of res.data?.items ?? []) {
      records.push({
        record_id: item.record_id!,
        fields: (item.fields as Record<string, unknown>) ?? {},
      })
    }

    pageToken = res.data?.page_token || undefined
  } while (pageToken)

  return records
}
