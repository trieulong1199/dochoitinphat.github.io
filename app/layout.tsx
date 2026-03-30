import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Đặt hàng sỉ - Đồ chơi Tín Phát',
  description: 'Cổng đặt hàng sỉ dành cho đại lý Đồ chơi Tín Phát',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
