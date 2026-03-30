import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Middleware dùng config Edge-compatible (không import Lark SDK)
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
