import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { readSubscribers, removeSubscriberById } from '@/lib/subscribers'
import { readAppConfig } from '@/lib/store'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'
import { getSubscribersForSlug } from '@/lib/subscribers'
import { sendNotificationsForChangelog, isMailEnabled } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

async function isAdmin(req: NextRequest, res: NextResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return session.isAdmin === true
}

// GET — list all subscribers
export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const store = readSubscribers()
  // Redact nothing — admin sees all
  return NextResponse.json({
    subscribers: store.subscribers,
    count: store.subscribers.length,
    emailEnabled: isMailEnabled(),
  })
}

// DELETE — remove a subscriber by id
export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = (await req.json()) as { id: string }
  const ok = removeSubscriberById(id)
  return NextResponse.json({ ok })
}

// POST — send manual notification to all relevant subscribers for a slug
export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  if (!isMailEnabled()) {
    return NextResponse.json({ error: 'SMTP non configuré' }, { status: 400 })
  }

  const { slug } = (await req.json()) as { slug: string }
  const cfg = readAppConfig()
  if (!cfg.repo) return NextResponse.json({ error: 'Aucun dépôt configuré' }, { status: 400 })

  const changelogs = cfg.repo.provider === 'gitlab'
    ? await fetchGitLabChangelogs(cfg.repo)
    : await fetchGitHubChangelogs(cfg.repo)

  const cl = changelogs.find(c => c.slug === slug)
  if (!cl) return NextResponse.json({ error: 'Application introuvable' }, { status: 404 })

  const subs = getSubscribersForSlug(slug)
  const result = await sendNotificationsForChangelog(cl, subs, cfg.settings.siteName)

  return NextResponse.json({ ok: true, ...result })
}
