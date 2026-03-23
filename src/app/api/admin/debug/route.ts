import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { readAppConfig } from '@/lib/store'
import { fetchGitHubChangelogs } from '@/lib/github'
import { fetchGitLabChangelogs } from '@/lib/gitlab'
import path from 'path'
import fs from 'fs'

// Force dynamic — uses cookies/filesystem at runtime
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  if (!session.isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const DATA_DIR = process.env.DATA_DIR ?? './data'
  const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

  const report: Record<string, unknown> = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATA_DIR,
      CONFIG_FILE,
      cwd: process.cwd(),
    },
    configFileExists: fs.existsSync(CONFIG_FILE),
    configFileContent: null as unknown,
    repoConfig: null as unknown,
    fetchResult: null as unknown,
    fetchError: null as unknown,
  }

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      report.configFileContent = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch (e) {
    report.configFileContent = `READ ERROR: ${e}`
  }

  const cfg = readAppConfig()
  if (cfg.repo) {
    report.repoConfig = {
      provider: cfg.repo.provider,
      repoUrl: cfg.repo.repoUrl,
      branch: cfg.repo.branch,
      isPrivate: cfg.repo.isPrivate,
      hasToken: !!cfg.repo.token,
      username: cfg.repo.username,
    }

    try {
      const changelogs = cfg.repo.provider === 'gitlab'
        ? await fetchGitLabChangelogs(cfg.repo)
        : await fetchGitHubChangelogs(cfg.repo)
      report.fetchResult = {
        count: changelogs.length,
        files: changelogs.map(c => ({ name: c.name, slug: c.slug, filePath: c._filePath, versions: c.versions.length })),
      }
    } catch (e) {
      report.fetchError = e instanceof Error ? { message: e.message, stack: e.stack } : String(e)
    }
  }

  return NextResponse.json(report, { status: 200 })
}
