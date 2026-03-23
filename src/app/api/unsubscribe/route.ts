import { NextRequest, NextResponse } from 'next/server'
import { removeSubscriberByToken } from '@/lib/subscribers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  const ok = removeSubscriberByToken(token)
  if (!ok) return NextResponse.json({ error: 'Token invalide ou déjà supprimé' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
