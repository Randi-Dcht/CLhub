import { NextResponse } from 'next/server'
import { readAppConfig } from '@/lib/store'

// Public — exposes only non-sensitive info (site name)
export async function GET() {
  const cfg = readAppConfig()
  return NextResponse.json({ siteName: cfg.settings.siteName })
}
