import { LARK_CONFIG, PRODUCT_FIELDS, listAllRecords } from './client'

export interface LarkProduct {
  recordId: string
  productId: string
  sku: string
  name: string
  quiCach: number
  giaVip: number
  giaThung: number
  imageUrl: string | null
}

function extractImageUrl(attachments: unknown, recordId: string): string | null {
  if (!Array.isArray(attachments) || attachments.length === 0) return null
  // Dùng proxy route để tránh tmp_url hết hạn
  return `/api/images/${recordId}`
}

export async function getLarkProducts(): Promise<LarkProduct[]> {
  const records = await listAllRecords(LARK_CONFIG.tables.products)

  return records.map((record) => {
    const fields = record.fields
    const quiCach = Number(fields[PRODUCT_FIELDS.QUI_CACH]) || 0
    const giaVip = Number(fields[PRODUCT_FIELDS.GIA_VIP]) || 0

    return {
      recordId: record.record_id,
      productId: String(fields[PRODUCT_FIELDS.PRODUCT_ID] || ''),
      sku: String(fields[PRODUCT_FIELDS.SKU] || ''),
      name: String(fields[PRODUCT_FIELDS.NAME] || ''),
      quiCach,
      giaVip,
      giaThung: giaVip * quiCach,
      imageUrl: extractImageUrl(fields[PRODUCT_FIELDS.IMAGE], record.record_id),
    }
  })
}
