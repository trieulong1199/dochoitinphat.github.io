import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  CONFIRMED: 'default',
  SHIPPING: 'secondary',
  DONE: 'success',
  CANCELLED: 'destructive',
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session) return null

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có đơn hàng nào</p>
          <Link href="/products" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
            Đặt hàng ngay →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-800">{order.orderCode}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(order.createdAt, 'dd/MM/yyyy HH:mm')} · {order.items.length} mặt hàng
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                    <p className="font-bold text-orange-600 mt-1">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
