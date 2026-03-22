import { NextRequest, NextResponse } from 'next/server'
import { RepositoryConfig } from '@/types'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'

export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as RepositoryConfig
    if (!config.repoUrl) {
      return NextResponse.json({ error: "L'URL est requise" }, { status: 400 })
    }
    const changelogs = config.provider === 'gitlab'
      ? await fetchGitLabChangelogs(config)
      : await fetchGitHubChangelogs(config)
    return NextResponse.json({ changelogs, count: changelogs.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
