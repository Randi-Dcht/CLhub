import { NextRequest, NextResponse } from 'next/server'
import { readAppConfig } from '@/lib/store'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'

export const dynamic = 'force-dynamic'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug } = params
  const cfg = readAppConfig()
  if (!cfg.repo) return new NextResponse('Aucun dépôt configuré', { status: 404 })

  try {
    const changelogs = cfg.repo.provider === 'gitlab'
      ? await fetchGitLabChangelogs(cfg.repo)
      : await fetchGitHubChangelogs(cfg.repo)

    const cl = changelogs.find(c => c.slug === slug)
    if (!cl) return new NextResponse('Application introuvable', { status: 404 })

    const siteName = cfg.settings.siteName
    const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const items = cl.versions.map(v => {
      const desc = v.changes.map(c => `[${c.type.toUpperCase()}] ${c.description}`).join('\n')
      const link = `${appUrl}/apps/${cl.slug}#v${v.version}`
      const date = v.date ? new Date(v.date).toUTCString() : new Date().toUTCString()
      return `
    <item>
      <title>${escapeXml(`${cl.name} v${v.version}`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`
    }).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${cl.name} — ${siteName}`)}</title>
    <link>${escapeXml(`${appUrl}/apps/${cl.slug}`)}</link>
    <description>${escapeXml(cl.description ?? `Changelog de ${cl.name}`)}</description>
    <language>fr</language>
    <atom:link href="${escapeXml(`${appUrl}/apps/${cl.slug}/rss.xml`)}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    return new NextResponse(err instanceof Error ? err.message : 'Erreur', { status: 500 })
  }
}
