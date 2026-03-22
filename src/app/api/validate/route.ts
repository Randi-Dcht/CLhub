import { NextRequest, NextResponse } from 'next/server'
import { RepositoryConfig } from '@/types'
import { validateGitHub } from '@/lib/github'
import { validateGitLab } from '@/lib/gitlab'

export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as RepositoryConfig
    if (!config.repoUrl) {
      return NextResponse.json({ error: "L'URL est requise" }, { status: 400 })
    }
    const info = config.provider === 'gitlab'
      ? await validateGitLab(config)
      : await validateGitHub(config)
    return NextResponse.json(info)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 400 }
    )
  }
}
