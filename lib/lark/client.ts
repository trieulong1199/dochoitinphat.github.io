import * as lark from '@larksuiteoapi/node-sdk'

// ─── Lark Base field name constants ───────────────────────────────────────────
// Tập trung tất cả field names ở đây để dễ thay đổi nếu Lark đổi tên cột
export const LARK_FIELDS = {
  PRODUCT_ID: 'ID SP',
  SKU: 'SKU',
  NAME: 'Tên hàng',
  QUI_CACH: 'Qui cách',
  GIA_VIP: 'Giá VIP',
  IMAGE: 'Hình ảnh',
} as const

export const LARK_CONFIG = {
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  appToken: process.env.LARK_APP_TOKEN!,
  tableProducts: process.env.LARK_TABLE_PRODUCTS!,
  baseUrl: process.env.LARK_BASE_URL || 'https://open.larksuite.com',
} as const

// Singleton Lark client
const globalForLark = globalThis as unknown as {
  larkClient: lark.Client | undefined
}

export const larkClient =
  globalForLark.larkClient ??
  new lark.Client({
    appId: LARK_CONFIG.appId,
    appSecret: LARK_CONFIG.appSecret,
    domain: lark.Domain.Lark, // Singapore instance (Lark = international/larksuite.com)
    loggerLevel: process.env.NODE_ENV === 'development' ? lark.LoggerLevel.debug : lark.LoggerLevel.error,
  })

if (process.env.NODE_ENV !== 'production') globalForLark.larkClient = larkClient
