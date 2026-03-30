/**
 * Validate required environment variables at startup.
 * Import this file in lib/lark/client.ts để check sớm.
 */

const REQUIRED_ENV: Record<string, string> = {
  LARK_APP_ID: process.env.LARK_APP_ID ?? '',
  LARK_APP_SECRET: process.env.LARK_APP_SECRET ?? '',
  LARK_APP_TOKEN: process.env.LARK_APP_TOKEN ?? '',
  LARK_TABLE_PRODUCTS: process.env.LARK_TABLE_PRODUCTS ?? '',
  LARK_TABLE_USERS: process.env.LARK_TABLE_USERS ?? '',
  LARK_TABLE_ORDERS: process.env.LARK_TABLE_ORDERS ?? '',
  LARK_TABLE_ORDER_ITEMS: process.env.LARK_TABLE_ORDER_ITEMS ?? '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
}

export function validateEnv() {
  const missing = Object.entries(REQUIRED_ENV)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(
      `[ENV] Thiếu biến môi trường bắt buộc:\n  ${missing.join('\n  ')}\n` +
      `Kiểm tra file .env.local theo mẫu .env.example`
    )
  }
}

// Chạy khi module được import (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (e) {
    // Trong build time chưa có env → warning thay vì crash
    if (process.env.NODE_ENV === 'production') throw e
    console.warn(String(e))
  }
}
