import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

// Force dynamic — uses cookies/filesystem at runtime
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return NextResponse.json({ isAdmin: session.isAdmin === true })
}
