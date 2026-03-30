import { auth } from '@/auth'
import { getOrdersByUserId, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/lark/orders'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  CONFIRMED: 'default',
  SHIPPING: 'secondary',
  DONE: 'success',
  CANCELLED: 'destructive',
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session) return null

  const orders = await getOrdersByUserId(session.user.id)

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
            <Link key={order.recordId} href={`/orders/${order.recordId}`}>
              <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-800">{order.orderCode}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {ORDER_STATUS_LABEL[order.status]}
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
