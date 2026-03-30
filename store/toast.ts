import { create } from 'zustand'

type ToastVariant = 'default' | 'success' | 'destructive'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastState {
  toasts: ToastItem[]
  toast: (opts: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (opts) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { ...opts, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Shorthand hook
export function useToast() {
  return useToastStore((s) => s.toast)
}
