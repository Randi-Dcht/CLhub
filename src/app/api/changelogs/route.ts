import { NextResponse } from 'next/server'
import { readAppConfig } from '@/lib/store'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'

// Force dynamic — reads config from filesystem at runtime, never cached
export const dynamic = 'force-dynamic'

export async function GET() {
  const cfg = readAppConfig()

  if (!cfg.repo) {
    return NextResponse.json({ error: 'Aucun dépôt configuré' }, { status: 404 })
  }

  try {
    const changelogs = cfg.repo.provider === 'gitlab'
      ? await fetchGitLabChangelogs(cfg.repo)
      : await fetchGitHubChangelogs(cfg.repo)

    console.log(`[changelogs] fetched ${changelogs.length} from ${cfg.repo.repoUrl}`)
    return NextResponse.json({ changelogs, count: changelogs.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[changelogs] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
