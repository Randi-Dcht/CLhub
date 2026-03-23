import { NextResponse } from 'next/server'
import { readAppConfig } from '@/lib/store'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'
import { ChangelogFile } from '@/types'

export const dynamic = 'force-dynamic'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildRss(changelogs: ChangelogFile[], siteName: string, appUrl: string): string {
  const allItems: Array<{ title: string; link: string; date: string; desc: string; app: string }> = []

  for (const cl of changelogs) {
    for (const v of cl.versions) {
      allItems.push({
        app: cl.name,
        title: `${cl.name} v${v.version}`,
        link: `${appUrl}/apps/${cl.slug}#v${v.version}`,
        date: v.date ? new Date(v.date).toUTCString() : new Date().toUTCString(),
        desc: v.changes
          .map(c => `[${c.type.toUpperCase()}] ${c.description}`)
          .join('\n'),
      })
    }
  }

  // Sort by date descending
  allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latest50 = allItems.slice(0, 50)

  const items = latest50.map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${item.date}</pubDate>
      <category>${escapeXml(item.app)}</category>
      <description>${escapeXml(item.desc)}</description>
    </item>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(appUrl)}/apps</link>
    <description>Toutes les mises à jour de ${escapeXml(siteName)}</description>
    <language>fr</language>
    <atom:link href="${escapeXml(appUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`
}

export async function GET() {
  const cfg = readAppConfig()

  if (!cfg.repo) {
    return new NextResponse('Aucun dépôt configuré', { status: 404 })
  }

  try {
    const changelogs = cfg.repo.provider === 'gitlab'
      ? await fetchGitLabChangelogs(cfg.repo)
      : await fetchGitHubChangelogs(cfg.repo)

    const siteName = cfg.settings.siteName
    const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    const xml = buildRss(changelogs, siteName, appUrl)

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : 'Erreur',
      { status: 500 },
    )
  }
}
