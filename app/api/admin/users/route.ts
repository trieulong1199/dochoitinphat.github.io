import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUser, getUserByUsername } from '@/lib/lark/users'
import { z } from 'zod'

// Bảo vệ bằng ADMIN_SECRET trong header
// Gọi: POST /api/admin/users  với header x-admin-secret: <ADMIN_SECRET>

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  companyName: z.string().min(1),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { username, password, companyName, phone } = parsed.data

  const existing = await getUserByUsername(username)
  if (existing) {
    return NextResponse.json({ error: 'Username đã tồn tại' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await createUser({ username, password: hashedPassword, companyName, phone })

  return NextResponse.json(
    { recordId: user.recordId, username: user.username, companyName: user.companyName },
    { status: 201 }
  )
}
