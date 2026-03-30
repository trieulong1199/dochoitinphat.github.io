'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, X, Trash2, Minus, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/store/toast'
import { formatCurrency } from '@/lib/utils'

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const router = useRouter()
  const toast = useToast()

  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCartStore()
  const total = totalAmount()
  const count = totalItems()

  async function handleOrder() {
    if (items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, note }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Lỗi tạo đơn hàng')
      }

      const data = await res.json()
      clearCart()
      setOpen(false)
      setNote('')
      toast({ title: '🎉 Đặt hàng thành công!', description: `Mã đơn: ${data.orderCode}`, variant: 'success' })
      router.push(`/orders/${data.orderId}`)
    } catch (err) {
      toast({
        title: 'Đặt hàng thất bại',
        description: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Giỏ hàng"
      >
        <ShoppingCart size={24} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Giỏ hàng ({count} thùng)</h2>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Giỏ hàng trống</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.larkSkuId} className="flex gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                      <p className="font-medium text-sm leading-tight truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.quiCach} cái/thùng · {formatCurrency(item.giaThung)}/thùng
                      </p>
                      <p className="font-bold text-orange-600 text-sm mt-1">
                        {formatCurrency(item.giaThung * item.soLuongThung)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center border rounded overflow-hidden">
                        <button
                          className="px-2 py-1 hover:bg-gray-200"
                          onClick={() => updateQuantity(item.larkSkuId, item.soLuongThung - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.soLuongThung}</span>
                        <button
                          className="px-2 py-1 hover:bg-gray-200"
                          onClick={() => updateQuantity(item.larkSkuId, item.soLuongThung + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.larkSkuId)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t space-y-3">
                <textarea
                  placeholder="Ghi chú đơn hàng (không bắt buộc)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full text-sm border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-orange-600">{formatCurrency(total)}</span>
                </div>
                <Button onClick={handleOrder} className="w-full" disabled={submitting}>
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
