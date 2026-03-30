/**
 * Script setup bảng Lark Base
 * Chạy: npx ts-node --skip-project scripts/setup-lark-tables.ts
 *
 * Tự động:
 *  1. Lấy danh sách fields hiện có trong từng bảng
 *  2. So sánh với schema mong muốn
 *  3. Tạo các cột còn thiếu
 *  4. In kết quả
 */

import * as lark from '@larksuiteoapi/node-sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

// ─── Config ───────────────────────────────────────────────────────────────────
const APP_TOKEN = process.env.LARK_APP_TOKEN!
const TABLES = {
  users: process.env.LARK_TABLE_USERS!,
  orders: process.env.LARK_TABLE_ORDERS!,
  orderItems: process.env.LARK_TABLE_ORDER_ITEMS!,
  products: process.env.LARK_TABLE_PRODUCTS!,
}

const client = new lark.Client({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  domain: lark.Domain.Lark,
})

// ─── Schema mong muốn ────────────────────────────────────────────────────────
type FieldType = 1 | 2 | 3 | 5 | 7 | 11 | 13 | 15 | 17 | 18 | 19 | 20 | 21 | 22 | 23
// 1=text, 2=number, 3=single_select, 5=multi_select, 7=datetime, 11=checkbox, 13=user, 15=url, 17=attachment, 18=link, 19=formula, 20=lookup, 21=rollup, 22=auto_number, 23=barcode

interface FieldDef {
  name: string
  type: FieldType
  options?: { name: string; color?: number }[]  // for single_select
}

const SCHEMA: Record<keyof typeof TABLES, FieldDef[]> = {
  products: [], // Bảng sản phẩm đã có sẵn, không tạo cột

  users: [
    { name: 'username',    type: 1 },  // text
    { name: 'password',    type: 1 },  // text (bcrypt hash)
    { name: 'companyName', type: 1 },  // text
    { name: 'phone',       type: 1 },  // text
    { name: 'isActive',    type: 11 }, // checkbox
  ],

  orders: [
    { name: 'orderCode',   type: 1 },  // text
    { name: 'userId',      type: 1 },  // text (recordId from users)
    { name: 'companyName', type: 1 },  // text
    { name: 'phone',       type: 1 },  // text
    {
      name: 'status', type: 3,         // single_select
      options: [
        { name: 'PENDING',   color: 6 },
        { name: 'CONFIRMED', color: 1 },
        { name: 'SHIPPING',  color: 2 },
        { name: 'DONE',      color: 0 },
        { name: 'CANCELLED', color: 4 },
      ],
    },
    { name: 'totalAmount', type: 2 },  // number
    { name: 'note',        type: 1 },  // text
    { name: 'createdAt',   type: 1 },  // text (ISO string)
  ],

  orderItems: [
    { name: 'orderCode',    type: 1 }, // text
    { name: 'larkSkuId',    type: 1 }, // text
    { name: 'sku',          type: 1 }, // text
    { name: 'name',         type: 1 }, // text
    { name: 'quiCach',      type: 2 }, // number
    { name: 'giaVip',       type: 2 }, // number
    { name: 'giaThung',     type: 2 }, // number
    { name: 'soLuongThung', type: 2 }, // number
    { name: 'thanhTien',    type: 2 }, // number
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getExistingFields(tableId: string): Promise<string[]> {
  const res = await client.bitable.appTableField.list({
    path: { app_token: APP_TOKEN, table_id: tableId },
    params: { page_size: 100 },
  })
  return (res.data?.items ?? []).map((f) => f.field_name ?? '')
}

async function createField(tableId: string, field: FieldDef): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property: Record<string, any> = {}
  if (field.type === 3 && field.options) {
    property['options'] = field.options.map((o) => ({ name: o.name, color: o.color ?? 0 }))
  }

  await client.bitable.appTableField.create({
    path: { app_token: APP_TOKEN, table_id: tableId },
    data: {
      field_name: field.name,
      type: field.type,
      ...(Object.keys(property).length > 0 ? { property } : {}),
    },
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔧 Kiểm tra và khởi tạo bảng Lark Base...\n')

  for (const [tableName, tableId] of Object.entries(TABLES)) {
    const schema = SCHEMA[tableName as keyof typeof SCHEMA]
    if (schema.length === 0) {
      console.log(`⏭  ${tableName} (${tableId}): bỏ qua`)
      continue
    }

    console.log(`📋 ${tableName} (${tableId})`)

    let existing: string[]
    try {
      existing = await getExistingFields(tableId)
      console.log(`   Cột hiện có: ${existing.join(', ')}`)
    } catch (err) {
      console.error(`   ❌ Lỗi đọc fields: ${err}`)
      continue
    }

    const missing = schema.filter((f) => !existing.includes(f.name))

    if (missing.length === 0) {
      console.log(`   ✅ Đủ cột`)
    } else {
      console.log(`   ⚠️  Thiếu: ${missing.map((f) => f.name).join(', ')}`)
      for (const field of missing) {
        try {
          await createField(tableId, field)
          console.log(`   ✅ Đã tạo: ${field.name}`)
        } catch (err) {
          console.error(`   ❌ Lỗi tạo ${field.name}: ${err}`)
        }
      }
    }
    console.log()
  }

  console.log('✅ Hoàn tất setup!\n')
}

main().catch(console.error)
