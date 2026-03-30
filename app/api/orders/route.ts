import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { writeLarkOrder } from '@/lib/lark/orders'
import { z } from 'zod'
import { format } from 'date-fns'

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

async function generateOrderCode(date: Date): Promise<string> {
  const dateStr = format(date, 'yyyyMMdd')
  const prefix = `TKL-${dateStr}`

  const lastOrder = await prisma.order.findFirst({
    where: { orderCode: { startsWith: prefix } },
    orderBy: { orderCode: 'desc' },
  })

  let seq = 1
  if (lastOrder) {
    const parts = lastOrder.orderCode.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 })
  }

  const { items, note } = parsed.data
  const now = new Date()
  const orderCode = await generateOrderCode(now)
  const totalAmount = items.reduce((sum, item) => sum + item.giaThung * item.soLuongThung, 0)

  const order = await prisma.order.create({
    data: {
      orderCode,
      userId: session.user.id,
      totalAmount,
      note,
      items: {
        create: items.map((item) => ({
          larkSkuId: item.larkSkuId,
          sku: item.sku,
          name: item.name,
          quiCach: item.quiCach,
          giaVip: item.giaVip,
          giaThung: item.giaThung,
          soLuongThung: item.soLuongThung,
          thanhTien: item.giaThung * item.soLuongThung,
        })),
      },
    },
    include: {
      items: true,
      user: true,
    },
  })

  // Ghi vào Lark Base (không block response)
  writeLarkOrder(order).then((larkId) => {
    if (larkId) {
      prisma.order.update({ where: { id: order.id }, data: { larkOrderId: larkId } }).catch(console.error)
    }
  })

  return NextResponse.json({ orderId: order.id, orderCode: order.orderCode }, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return NextResponse.json(orders)
}
