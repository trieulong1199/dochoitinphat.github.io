import { redirect } from 'next/navigation'

// Redirect to products - giỏ hàng dùng CartDrawer (sidebar)
export default function CartPage() {
  redirect('/products')
}
