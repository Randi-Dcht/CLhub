import fs from 'fs'
import path from 'path'
import { AppConfig, RepositoryConfig, AppSettings } from '@/types'

function getDataDir(): string {
  const dir = process.env.DATA_DIR ?? './data'
  // Make absolute relative to cwd
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir)
}

function getConfigFile(): string {
  return path.join(getDataDir(), 'config.json')
}

const DEFAULT_SETTINGS: AppSettings = { siteName: 'ChangeLog Hub' }

function ensureDir(): void {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function readAppConfig(): AppConfig {
  try {
    ensureDir()
    const configFile = getConfigFile()
    if (!fs.existsSync(configFile)) {
      return { repo: null, settings: DEFAULT_SETTINGS, updatedAt: null }
    }
    const raw = fs.readFileSync(configFile, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return {
      repo: parsed.repo ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      updatedAt: parsed.updatedAt ?? null,
    }
  } catch (e) {
    console.error('[store] readAppConfig error:', e)
    return { repo: null, settings: DEFAULT_SETTINGS, updatedAt: null }
  }
}

export function writeRepo(repo: RepositoryConfig | null): AppConfig {
  ensureDir()
  const current = readAppConfig()
  const cfg: AppConfig = { ...current, repo, updatedAt: new Date().toISOString() }
  fs.writeFileSync(getConfigFile(), JSON.stringify(cfg, null, 2), 'utf-8')
  console.log('[store] writeRepo →', getConfigFile(), '| repo:', repo?.repoUrl ?? 'null')
  return cfg
}

export function writeSettings(settings: Partial<AppSettings>): AppConfig {
  ensureDir()
  const current = readAppConfig()
  const cfg: AppConfig = {
    ...current,
    settings: { ...current.settings, ...settings },
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(getConfigFile(), JSON.stringify(cfg, null, 2), 'utf-8')
  return cfg
}

export { writeRepo as writeAppConfig }
