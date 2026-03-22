import { NextResponse } from 'next/server'
import { readAppConfig } from '@/lib/store'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'

export async function GET() {
  const cfg = readAppConfig()
  if (!cfg.repo) {
    return NextResponse.json({ error: 'Aucun dépôt configuré' }, { status: 404 })
  }
  try {
    const changelogs = cfg.repo.provider === 'gitlab'
      ? await fetchGitLabChangelogs(cfg.repo)
      : await fetchGitHubChangelogs(cfg.repo)
    return NextResponse.json({ changelogs, count: changelogs.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur' },
      { status: 500 }
    )
  }
}
