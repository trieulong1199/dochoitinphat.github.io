import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PackageSearch } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <PackageSearch size={48} className="text-gray-300" />
      <div>
        <h2 className="text-xl font-bold text-gray-800">Không tìm thấy trang</h2>
        <p className="text-gray-500 text-sm mt-1">Trang bạn tìm không tồn tại.</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/products">Về trang sản phẩm</Link>
      </Button>
    </div>
  )
}
