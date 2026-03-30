import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createOrder, getOrdersByUserId } from '@/lib/lark/orders'
import { z } from 'zod'

const cartItemSchema = z.object({
  larkSkuId: z.string(),
  sku: z.string(),
  name: z.string(),
  quiCach: z.number().int().positive(),
  giaVip: z.number().positive(),
  giaThung: z.number().positive(),
  soLuongThung: z.number().int().positive(),
})

const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { items, note } = parsed.data

  const order = await createOrder({
    userId: session.user.id,
    companyName: session.user.companyName,
    phone: session.user.phone,
    note,
    items,
  })

  return NextResponse.json(
    { orderId: order.recordId, orderCode: order.orderCode },
    { status: 201 }
  )
}

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await getOrdersByUserId(session.user.id)
  return NextResponse.json(orders)
}
