'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle size={48} className="text-red-400" />
      <div>
        <h2 className="text-xl font-bold text-gray-800">Có lỗi xảy ra</h2>
        <p className="text-gray-500 text-sm mt-1">
          {error.message || 'Vui lòng thử lại hoặc liên hệ hỗ trợ.'}
        </p>
      </div>
      <Button onClick={reset} variant="outline">Thử lại</Button>
    </div>
  )
}
