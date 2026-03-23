import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/subscribers'
import { readAppConfig } from '@/lib/store'
import { sendWelcomeEmail, isMailEnabled } from '@/lib/mailer'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email: string; slugs: string[] | null }

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
  }

  const sub = addSubscriber(body.email, body.slugs)

  // Send welcome email
  if (isMailEnabled()) {
    const cfg = readAppConfig()
    const siteName = cfg.settings.siteName
    let appNames: string[] = []

    if (body.slugs && body.slugs.length > 0 && cfg.repo) {
      try {
        const changelogs = cfg.repo.provider === 'gitlab'
          ? await fetchGitLabChangelogs(cfg.repo)
          : await fetchGitHubChangelogs(cfg.repo)
        appNames = changelogs
          .filter(c => body.slugs!.includes(c.slug))
          .map(c => c.name)
      } catch { /* ignore */ }
    }

    sendWelcomeEmail(sub, siteName, appNames).catch(e =>
      console.error('[subscribe] welcome email failed:', e)
    )
  }

  return NextResponse.json({
    ok: true,
    id: sub.id,
    emailEnabled: isMailEnabled(),
  })
}
