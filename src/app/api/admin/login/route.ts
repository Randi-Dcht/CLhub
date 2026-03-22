import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as {
    username: string
    password: string
  }

  const expectedUser = process.env.ADMIN_USERNAME ?? 'admin'
  const expectedPass = process.env.ADMIN_PASSWORD ?? 'admin1234'

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  session.isAdmin = true
  await session.save()
  return res
}
