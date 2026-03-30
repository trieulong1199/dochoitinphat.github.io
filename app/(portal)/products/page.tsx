import { getLarkProducts, type LarkProduct } from '@/lib/lark/products'
import { ProductGrid } from '@/components/products/ProductGrid'

export const revalidate = 600 // cache 10 phút

export default async function ProductsPage() {
  let products: LarkProduct[] = []
  let error = null

  try {
    products = await getLarkProducts()
  } catch (err) {
    console.error('[Products] Lỗi lấy sản phẩm từ Lark:', err)
    error = 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.'
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Danh sách sản phẩm</h1>
      <ProductGrid products={products} />
    </div>
  )
}
