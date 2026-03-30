import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    companyName: string
    phone?: string | null
  }

  interface Session {
    user: {
      id: string
      username: string
      companyName: string
      phone?: string
    }
  }
}
