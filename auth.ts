import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/lark/users'
import { authConfig } from './auth.config'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Tên đăng nhập', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { username, password } = parsed.data
        const user = await getUserByUsername(username)

        if (!user || !user.isActive) return null

        const match = await bcrypt.compare(password, user.password)
        if (!match) return null

        return {
          id: user.recordId,
          name: user.companyName,
          username: user.username,
          companyName: user.companyName,
          phone: user.phone,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username?: string }).username
        token.companyName = (user as { companyName?: string }).companyName
        token.phone = (user as { phone?: string | null }).phone
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.companyName = token.companyName as string
        session.user.phone = token.phone as string | undefined
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
})
