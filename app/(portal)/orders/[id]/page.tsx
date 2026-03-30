import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, ArrowLeft } from 'lucide-react'

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

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return null

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true, user: true },
  })

  if (!order) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={14} /> Danh sách đơn hàng
      </Link>

      {/* Header */}
      <div className="bg-white border rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{order.orderCode}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(order.createdAt, 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[order.status]}>
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>

        {order.note && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
            <span className="font-medium">Ghi chú:</span> {order.note}
          </div>
        )}

        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/orders/${order.id}/pdf`} download>
              <Download size={14} />
              Tải PDF đơn hàng
            </a>
          </Button>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-700">Chi tiết đơn hàng</h2>
        </div>

        {/* Desktop table */}
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
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
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

        {/* Mobile list */}
        <div className="sm:hidden divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 space-y-1">
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

        {/* Total */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center font-bold">
          <span>Tổng cộng</span>
          <span className="text-xl text-orange-600">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}
