'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToastStore } from '@/store/toast'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} open>
          <div className="grid gap-0.5 flex-1">
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
