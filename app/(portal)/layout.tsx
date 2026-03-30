import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { signOut } from '@/auth'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { LogOut, Package } from 'lucide-react'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={22} className="text-blue-600" />
            <span className="font-bold text-gray-800 hidden sm:block">Đồ chơi Tín Phát</span>
            <span className="font-bold text-gray-800 sm:hidden">Tín Phát</span>
          </div>

          <nav className="flex items-center gap-1 text-sm">
            <a href="/products" className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
              Sản phẩm
            </a>
            <a href="/orders" className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
              Đơn hàng
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden md:block">{session.user.companyName}</span>
            <CartDrawer />
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button type="submit" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors" title="Đăng xuất">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
