/**
 * GET /api/images/[recordId]
 *
 * Proxy ảnh từ Lark Base. Lark trả về `tmp_url` hết hạn sau ~10 phút,
 * nên thay vì lưu URL trực tiếp, ta fetch record mới để lấy URL hiện tại
 * rồi redirect 302 (browser tự cache theo Cache-Control của Lark).
 */
import { NextRequest, NextResponse } from 'next/server'
import { larkClient, LARK_CONFIG, PRODUCT_FIELDS } from '@/lib/lark/client'
import { auth } from '@/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { recordId: string } }
) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const res = await larkClient.bitable.appTableRecord.get({
      path: {
        app_token: LARK_CONFIG.appToken,
        table_id: LARK_CONFIG.tables.products,
        record_id: params.recordId,
      },
    })

    const fields = res.data?.record?.fields as Record<string, unknown> | undefined
    const attachments = fields?.[PRODUCT_FIELDS.IMAGE]

    if (!Array.isArray(attachments) || attachments.length === 0) {
      return new NextResponse('No image', { status: 404 })
    }

    const first = attachments[0] as { tmp_url?: string; url?: string }
    const imageUrl = first.tmp_url || first.url

    if (!imageUrl) return new NextResponse('No image URL', { status: 404 })

    // Redirect trình duyệt đến URL thật — không cache lâu vì tmp_url hết hạn
    return NextResponse.redirect(imageUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'private, max-age=300', // cache 5 phút ở browser
      },
    })
  } catch (err) {
    console.error('[ImageProxy]', err)
    return new NextResponse('Error', { status: 500 })
  }
}
