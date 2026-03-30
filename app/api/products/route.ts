import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLarkProducts } from '@/lib/lark/products'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await getLarkProducts()
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[API] Lỗi lấy sản phẩm:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

// Next.js fetch cache revalidate 600s
export const revalidate = 600
