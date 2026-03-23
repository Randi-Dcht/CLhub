import { NextResponse } from 'next/server'
import { readAppConfig } from '@/lib/store'

// Force dynamic — reads from filesystem at runtime, never cached
export const dynamic = 'force-dynamic'

export async function GET() {
  const cfg = readAppConfig()
  return NextResponse.json({ siteName: cfg.settings.siteName })
}
