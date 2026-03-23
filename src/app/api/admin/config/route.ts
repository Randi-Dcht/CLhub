import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { readAppConfig, writeRepo } from '@/lib/store'
import { RepositoryConfig } from '@/types'
import { validateGitHub } from '@/lib/github'
import { validateGitLab } from '@/lib/gitlab'

// Force dynamic — uses cookies/filesystem at runtime
export const dynamic = 'force-dynamic'

async function isAdmin(req: NextRequest, res: NextResponse): Promise<boolean> {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return session.isAdmin === true
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const cfg = readAppConfig()
  // Redact token before sending to client
  const safe = cfg.repo ? { ...cfg.repo, token: cfg.repo.token ? '••••••••' : undefined } : null
  return NextResponse.json({ ...cfg, repo: safe })
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  if (!(await isAdmin(req, res))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = (await req.json()) as { repo: RepositoryConfig }
  const incoming = body.repo
  if (!incoming?.repoUrl) return NextResponse.json({ error: "L'URL du dépôt est requise" }, { status: 400 })

  // If token field is the redacted placeholder, restore the real token from storage
  const existing = readAppConfig()
  const realToken =
    incoming.token === '••••••••' || !incoming.token
      ? existing.repo?.token
      : incoming.token

  const repo: RepositoryConfig = { ...incoming, token: realToken }

  try {
    const info = repo.provider === 'gitlab'
      ? await validateGitLab(repo)
      : await validateGitHub(repo)
    const saved = writeRepo(repo)
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
