import { larkClient, LARK_CONFIG, LARK_FIELDS } from './client'

export interface LarkProduct {
  recordId: string
  productId: string
  sku: string
  name: string
  quiCach: number      // số cái/thùng
  giaVip: number       // giá 1 cái
  giaThung: number     // = giaVip × quiCach
  imageUrl: string | null
}

function extractImageUrl(attachments: unknown): string | null {
  if (!Array.isArray(attachments) || attachments.length === 0) return null
  const first = attachments[0] as { tmp_url?: string; url?: string }
  return first.tmp_url || first.url || null
}

export async function getLarkProducts(): Promise<LarkProduct[]> {
  const products: LarkProduct[] = []

  let pageToken: string | undefined = undefined

  do {
    const res = await larkClient.bitable.appTableRecord.list({
      path: {
        app_token: LARK_CONFIG.appToken,
        table_id: LARK_CONFIG.tableProducts,
      },
      params: {
        page_size: 100,
        page_token: pageToken,
      },
    })

    if (!res.data?.items) break

    for (const record of res.data.items) {
      const fields = record.fields as Record<string, unknown>

      const quiCach = Number(fields[LARK_FIELDS.QUI_CACH]) || 0
      const giaVip = Number(fields[LARK_FIELDS.GIA_VIP]) || 0

      products.push({
        recordId: record.record_id!,
        productId: String(fields[LARK_FIELDS.PRODUCT_ID] || ''),
        sku: String(fields[LARK_FIELDS.SKU] || ''),
        name: String(fields[LARK_FIELDS.NAME] || ''),
        quiCach,
        giaVip,
        giaThung: giaVip * quiCach,
        imageUrl: extractImageUrl(fields[LARK_FIELDS.IMAGE]),
      })
    }

    pageToken = res.data.page_token || undefined
  } while (pageToken)

  return products
}
