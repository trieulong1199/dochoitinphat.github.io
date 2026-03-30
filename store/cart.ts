import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  larkSkuId: string
  sku: string
  name: string
  quiCach: number
  giaVip: number
  giaThung: number
  soLuongThung: number
  imageUrl: string | null
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQuantity: (larkSkuId: string, soLuongThung: number) => void
  removeItem: (larkSkuId: string) => void
  clearCart: () => void
  totalAmount: () => number
  totalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.larkSkuId === item.larkSkuId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.larkSkuId === item.larkSkuId
                  ? { ...i, soLuongThung: i.soLuongThung + item.soLuongThung }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),

      updateQuantity: (larkSkuId, soLuongThung) =>
        set((state) => ({
          items:
            soLuongThung <= 0
              ? state.items.filter((i) => i.larkSkuId !== larkSkuId)
              : state.items.map((i) =>
                  i.larkSkuId === larkSkuId ? { ...i, soLuongThung } : i
                ),
        })),

      removeItem: (larkSkuId) =>
        set((state) => ({
          items: state.items.filter((i) => i.larkSkuId !== larkSkuId),
        })),

      clearCart: () => set({ items: [] }),

      totalAmount: () =>
        get().items.reduce((sum, item) => sum + item.giaThung * item.soLuongThung, 0),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.soLuongThung, 0),
    }),
    {
      name: 'wholesale-cart',
    }
  )
)
