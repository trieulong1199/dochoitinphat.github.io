'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ProductCard } from './ProductCard'
import type { LarkProduct } from '@/lib/lark/products'

interface ProductGridProps {
  products: LarkProduct[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q)
    )
  }, [products, search])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          placeholder="Tìm kiếm theo tên, SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        {filtered.length} / {products.length} sản phẩm
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Không tìm thấy sản phẩm</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.recordId} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
