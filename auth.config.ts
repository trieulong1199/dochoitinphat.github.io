import type { NextAuthConfig } from 'next-auth'

// Config này chạy ở Edge Runtime (middleware) - KHÔNG import Node.js-only deps
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === '/login'

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/products', nextUrl))
      }
      if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL('/login', nextUrl))
      }
      return true
    },
  },
  providers: [], // Providers thật khai báo trong auth.ts
} satisfies NextAuthConfig
