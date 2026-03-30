'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/store/toast'
import { formatCurrency } from '@/lib/utils'
import type { LarkProduct } from '@/lib/lark/products'

interface ProductCardProps {
  product: LarkProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const toast = useToast()

  function handleAdd() {
    const qty = Math.max(1, quantity)
    addItem({
      larkSkuId: product.recordId,
      sku: product.sku,
      name: product.name,
      quiCach: product.quiCach,
      giaVip: product.giaVip,
      giaThung: product.giaThung,
      soLuongThung: qty,
      imageUrl: product.imageUrl,
    })
    toast({
      title: 'Đã thêm vào giỏ',
      description: `${product.name} × ${qty} thùng`,
      variant: 'success',
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <Package size={48} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={product.name}>
          {product.name}
        </h3>
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>Qui cách: <span className="font-medium text-gray-700">{product.quiCach} cái/thùng</span></p>
          <p>Giá VIP: <span className="font-medium text-blue-600">{formatCurrency(product.giaVip)}/cái</span></p>
        </div>
        <p className="text-base font-bold text-orange-600">
          {formatCurrency(product.giaThung)}
          <span className="text-xs font-normal text-gray-500">/thùng</span>
        </p>

        {/* Quantity + Add */}
        <div className="flex gap-2 pt-1">
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 h-8 text-center text-sm px-1"
          />
          <Button onClick={handleAdd} size="sm" className="flex-1 h-8 text-xs gap-1">
            <ShoppingCart size={13} />
            Thêm vào giỏ
          </Button>
        </div>
      </div>
    </div>
  )
}
