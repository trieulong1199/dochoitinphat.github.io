import { larkClient, LARK_CONFIG, ORDER_FIELDS, ORDER_ITEM_FIELDS, listAllRecords } from './client'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DONE' | 'CANCELLED'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export interface LarkOrderItem {
  recordId: string
  orderCode: string
  larkSkuId: string
  sku: string
  name: string
  quiCach: number
  giaVip: number
  giaThung: number
  soLuongThung: number
  thanhTien: number
}

export interface LarkOrder {
  recordId: string
  orderCode: string
  userId: string
  companyName: string
  phone?: string
  status: OrderStatus
  totalAmount: number
  note?: string
  createdAt: string
  items?: LarkOrderItem[]
}

export interface CreateOrderItemInput {
  larkSkuId: string
  sku: string
  name: string
  quiCach: number
  giaVip: number
  giaThung: number
  soLuongThung: number
}

export interface CreateOrderInput {
  userId: string
  companyName: string
  phone?: string
  note?: string
  items: CreateOrderItemInput[]
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseOrder(r: { record_id: string; fields: Record<string, unknown> }): LarkOrder {
  const f = r.fields
  return {
    recordId: r.record_id,
    orderCode: String(f[ORDER_FIELDS.ORDER_CODE] ?? ''),
    userId: String(f[ORDER_FIELDS.USER_ID] ?? ''),
    companyName: String(f[ORDER_FIELDS.COMPANY_NAME] ?? ''),
    phone: f[ORDER_FIELDS.PHONE] ? String(f[ORDER_FIELDS.PHONE]) : undefined,
    status: (f[ORDER_FIELDS.STATUS] as OrderStatus) ?? 'PENDING',
    totalAmount: Number(f[ORDER_FIELDS.TOTAL_AMOUNT] ?? 0),
    note: f[ORDER_FIELDS.NOTE] ? String(f[ORDER_FIELDS.NOTE]) : undefined,
    createdAt: String(f[ORDER_FIELDS.CREATED_AT] ?? new Date().toISOString()),
  }
}

function parseOrderItem(r: { record_id: string; fields: Record<string, unknown> }): LarkOrderItem {
  const f = r.fields
  return {
    recordId: r.record_id,
    orderCode: String(f[ORDER_ITEM_FIELDS.ORDER_CODE] ?? ''),
    larkSkuId: String(f[ORDER_ITEM_FIELDS.LARK_SKU_ID] ?? ''),
    sku: String(f[ORDER_ITEM_FIELDS.SKU] ?? ''),
    name: String(f[ORDER_ITEM_FIELDS.NAME] ?? ''),
    quiCach: Number(f[ORDER_ITEM_FIELDS.QUI_CACH] ?? 0),
    giaVip: Number(f[ORDER_ITEM_FIELDS.GIA_VIP] ?? 0),
    giaThung: Number(f[ORDER_ITEM_FIELDS.GIA_THUNG] ?? 0),
    soLuongThung: Number(f[ORDER_ITEM_FIELDS.SO_LUONG_THUNG] ?? 0),
    thanhTien: Number(f[ORDER_ITEM_FIELDS.THANH_TIEN] ?? 0),
  }
}

// ─── Order code generator ─────────────────────────────────────────────────────

async function generateOrderCode(): Promise<string> {
  const dateStr = format(new Date(), 'yyyyMMdd')
  const prefix = `TKL-${dateStr}`

  const records = await listAllRecords(LARK_CONFIG.tables.orders, {
    filter: `CurrentValue.[${ORDER_FIELDS.ORDER_CODE}].contains("${prefix}")`,
  })

  const seq = records.length + 1
  return `${prefix}-${String(seq).padStart(3, '0')}`
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<LarkOrder> {
  const orderCode = await generateOrderCode()
  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.giaThung * item.soLuongThung,
    0
  )
  const now = new Date().toISOString()

  // 1. Tạo order record
  const orderRes = await larkClient.bitable.appTableRecord.create({
    path: {
      app_token: LARK_CONFIG.appToken,
      table_id: LARK_CONFIG.tables.orders,
    },
    data: {
      fields: {
        [ORDER_FIELDS.ORDER_CODE]: orderCode,
        [ORDER_FIELDS.USER_ID]: input.userId,
        [ORDER_FIELDS.COMPANY_NAME]: input.companyName,
        [ORDER_FIELDS.PHONE]: input.phone ?? '',
        [ORDER_FIELDS.STATUS]: 'PENDING',
        [ORDER_FIELDS.TOTAL_AMOUNT]: totalAmount,
        [ORDER_FIELDS.NOTE]: input.note ?? '',
        [ORDER_FIELDS.CREATED_AT]: now,
      },
    },
  })

  const order = parseOrder({
    record_id: orderRes.data!.record!.record_id!,
    fields: (orderRes.data!.record!.fields as Record<string, unknown>) ?? {},
  })

  // 2. Tạo order items (batch)
  await createOrderItems(orderCode, input.items)

  return { ...order, items: input.items.map((item, i) => ({
    recordId: '',
    orderCode,
    ...item,
    thanhTien: item.giaThung * item.soLuongThung,
  }))}
}

async function createOrderItems(orderCode: string, items: CreateOrderItemInput[]): Promise<void> {
  // Lark batch create - up to 500 records at once
  const records = items.map((item) => ({
    fields: {
      [ORDER_ITEM_FIELDS.ORDER_CODE]: orderCode,
      [ORDER_ITEM_FIELDS.LARK_SKU_ID]: item.larkSkuId,
      [ORDER_ITEM_FIELDS.SKU]: item.sku,
      [ORDER_ITEM_FIELDS.NAME]: item.name,
      [ORDER_ITEM_FIELDS.QUI_CACH]: item.quiCach,
      [ORDER_ITEM_FIELDS.GIA_VIP]: item.giaVip,
      [ORDER_ITEM_FIELDS.GIA_THUNG]: item.giaThung,
      [ORDER_ITEM_FIELDS.SO_LUONG_THUNG]: item.soLuongThung,
      [ORDER_ITEM_FIELDS.THANH_TIEN]: item.giaThung * item.soLuongThung,
    },
  }))

  await larkClient.bitable.appTableRecord.batchCreate({
    path: {
      app_token: LARK_CONFIG.appToken,
      table_id: LARK_CONFIG.tables.orderItems,
    },
    data: { records },
  })
}

export async function getOrdersByUserId(userId: string): Promise<LarkOrder[]> {
  const records = await listAllRecords(LARK_CONFIG.tables.orders, {
    filter: `CurrentValue.[${ORDER_FIELDS.USER_ID}]="${userId}"`,
  })
  return records.map(parseOrder).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getOrderByCode(orderCode: string): Promise<LarkOrder | null> {
  const records = await listAllRecords(LARK_CONFIG.tables.orders, {
    filter: `CurrentValue.[${ORDER_FIELDS.ORDER_CODE}]="${orderCode}"`,
    pageSize: 1,
  })
  if (records.length === 0) return null

  const order = parseOrder(records[0])
  order.items = await getOrderItemsByCode(orderCode)
  return order
}

export async function getOrderByRecordId(recordId: string): Promise<LarkOrder | null> {
  try {
    const res = await larkClient.bitable.appTableRecord.get({
      path: {
        app_token: LARK_CONFIG.appToken,
        table_id: LARK_CONFIG.tables.orders,
        record_id: recordId,
      },
    })
    if (!res.data?.record) return null
    const order = parseOrder({
      record_id: recordId,
      fields: (res.data.record.fields as Record<string, unknown>) ?? {},
    })
    order.items = await getOrderItemsByCode(order.orderCode)
    return order
  } catch {
    return null
  }
}

export async function getOrderItemsByCode(orderCode: string): Promise<LarkOrderItem[]> {
  const records = await listAllRecords(LARK_CONFIG.tables.orderItems, {
    filter: `CurrentValue.[${ORDER_ITEM_FIELDS.ORDER_CODE}]="${orderCode}"`,
  })
  return records.map(parseOrderItem)
}
