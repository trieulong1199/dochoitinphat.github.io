import { auth } from '@/auth'
import { getOrderByRecordId, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/lark/orders'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, ArrowLeft } from 'lucide-react'

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

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return null

  const order = await getOrderByRecordId(params.id)

  if (!order || order.userId !== session.user.id) notFound()

  const items = order.items ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={14} /> Danh sách đơn hàng
      </Link>

      <div className="bg-white border rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{order.orderCode}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <Badge variant={STATUS_VARIANT[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </div>

        {order.note && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
            <span className="font-medium">Ghi chú:</span> {order.note}
          </div>
        )}

        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/orders/${order.recordId}/pdf`} download>
              <Download size={14} />
              Tải PDF đơn hàng
            </a>
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-700">Chi tiết đơn hàng</h2>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left p-3">Sản phẩm</th>
                <th className="text-center p-3">Qui cách</th>
                <th className="text-right p-3">Giá VIP</th>
                <th className="text-right p-3">Giá thùng</th>
                <th className="text-center p-3">SL thùng</th>
                <th className="text-right p-3">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.recordId || item.larkSkuId} className="hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                  </td>
                  <td className="p-3 text-center">{item.quiCach}</td>
                  <td className="p-3 text-right">{formatCurrency(item.giaVip)}</td>
                  <td className="p-3 text-right">{formatCurrency(item.giaThung)}</td>
                  <td className="p-3 text-center font-medium">{item.soLuongThung}</td>
                  <td className="p-3 text-right font-bold text-orange-600">{formatCurrency(item.thanhTien)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y">
          {items.map((item) => (
            <div key={item.recordId || item.larkSkuId} className="p-4 space-y-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{item.quiCach} cái/thùng × {formatCurrency(item.giaVip)}</span>
                <span>{formatCurrency(item.giaThung)}/thùng</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>× {item.soLuongThung} thùng</span>
                <span className="text-orange-600">{formatCurrency(item.thanhTien)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center font-bold">
          <span>Tổng cộng</span>
          <span className="text-xl text-orange-600">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}
