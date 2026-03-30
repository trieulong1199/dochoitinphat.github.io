import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrderByRecordId } from '@/lib/lark/orders'
import { renderToBuffer } from '@react-pdf/renderer'
import { OrderPDFDocument } from '@/lib/pdf/order-template'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = await getOrderByRecordId(params.id)

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(OrderPDFDocument, { order }) as any
  const buffer = await renderToBuffer(element)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${order.orderCode}.pdf"`,
    },
  })
}
