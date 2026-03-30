/**
 * POST /api/admin/setup
 * Header: x-admin-secret: <ADMIN_SECRET>
 *
 * Kiểm tra và tạo các cột còn thiếu trong bảng Lark Base.
 * Chạy 1 lần sau khi deploy.
 */
import { NextRequest, NextResponse } from 'next/server'
import * as lark from '@larksuiteoapi/node-sdk'
import { LARK_CONFIG } from '@/lib/lark/client'

type FieldType = 1 | 2 | 3 | 11
interface FieldDef {
  name: string
  type: FieldType
  options?: { name: string; color: number }[]
}

const SCHEMA: Record<string, { tableId: string; fields: FieldDef[] }> = {
  users: {
    tableId: LARK_CONFIG.tables.users,
    fields: [
      { name: 'username',    type: 1 },
      { name: 'password',    type: 1 },
      { name: 'companyName', type: 1 },
      { name: 'phone',       type: 1 },
      { name: 'isActive',    type: 11 },
    ],
  },
  orders: {
    tableId: LARK_CONFIG.tables.orders,
    fields: [
      { name: 'orderCode',   type: 1 },
      { name: 'userId',      type: 1 },
      { name: 'companyName', type: 1 },
      { name: 'phone',       type: 1 },
      {
        name: 'status', type: 3,
        options: [
          { name: 'PENDING',   color: 6 },
          { name: 'CONFIRMED', color: 1 },
          { name: 'SHIPPING',  color: 2 },
          { name: 'DONE',      color: 0 },
          { name: 'CANCELLED', color: 4 },
        ],
      },
      { name: 'totalAmount', type: 2 },
      { name: 'note',        type: 1 },
      { name: 'createdAt',   type: 1 },
    ],
  },
  orderItems: {
    tableId: LARK_CONFIG.tables.orderItems,
    fields: [
      { name: 'orderCode',    type: 1 },
      { name: 'larkSkuId',    type: 1 },
      { name: 'sku',          type: 1 },
      { name: 'name',         type: 1 },
      { name: 'quiCach',      type: 2 },
      { name: 'giaVip',       type: 2 },
      { name: 'giaThung',     type: 2 },
      { name: 'soLuongThung', type: 2 },
      { name: 'thanhTien',    type: 2 },
    ],
  },
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = new lark.Client({
    appId: LARK_CONFIG.appId,
    appSecret: LARK_CONFIG.appSecret,
    domain: lark.Domain.Lark,
    loggerLevel: lark.LoggerLevel.error,
  })

  const results: Record<string, {
    existing: string[]
    created: string[]
    errors: string[]
  }> = {}

  for (const [tableName, { tableId, fields }] of Object.entries(SCHEMA)) {
    const result = { existing: [] as string[], created: [] as string[], errors: [] as string[] }
    results[tableName] = result

    // Lấy danh sách cột hiện có
    try {
      const res = await client.bitable.appTableField.list({
        path: { app_token: LARK_CONFIG.appToken, table_id: tableId },
        params: { page_size: 100 },
      })
      result.existing = (res.data?.items ?? []).map((f) => f.field_name ?? '')
    } catch (err) {
      result.errors.push(`Lỗi đọc fields: ${String(err)}`)
      continue
    }

    // Tạo các cột còn thiếu
    for (const field of fields) {
      if (result.existing.includes(field.name)) continue

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const property: Record<string, any> = {}
        if (field.type === 3 && field.options) {
          property['options'] = field.options
        }

        await client.bitable.appTableField.create({
          path: { app_token: LARK_CONFIG.appToken, table_id: tableId },
          data: {
            field_name: field.name,
            type: field.type,
            ...(Object.keys(property).length > 0 ? { property } : {}),
          },
        })
        result.created.push(field.name)
      } catch (err) {
        result.errors.push(`Lỗi tạo ${field.name}: ${String(err)}`)
      }
    }
  }

  // Tổng kết
  const summary = Object.entries(results).map(([table, r]) => ({
    table,
    existingFields: r.existing,
    created: r.created,
    errors: r.errors,
    status: r.errors.length === 0 ? 'ok' : 'partial',
  }))

  return NextResponse.json({ summary })
}
