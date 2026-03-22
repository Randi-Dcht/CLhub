import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { readAppConfig, writeRepo } from '@/lib/store'
import { RepositoryConfig } from '@/types'
import { validateGitHub } from '@/lib/github'
import { validateGitLab } from '@/lib/gitlab'

async function isAdmin(req: NextRequest, res: NextResponse): Promise<boolean> {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return session.isAdmin === true
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const cfg = readAppConfig()
  if (cfg.repo?.token) cfg.repo = { ...cfg.repo, token: '••••••••' }
  return NextResponse.json(cfg)
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = (await req.json()) as { repo: RepositoryConfig }
  if (!body.repo?.repoUrl) return NextResponse.json({ error: "L'URL du dépôt est requise" }, { status: 400 })
  try {
    const info = body.repo.provider === 'gitlab'
      ? await validateGitLab(body.repo)
      : await validateGitHub(body.repo)
    const saved = writeRepo(body.repo)
    return NextResponse.json({ ok: true, info, updatedAt: saved.updatedAt })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  writeRepo(null)
  return NextResponse.json({ ok: true })
}
