import fs from 'fs'
import path from 'path'
import { AppConfig, RepositoryConfig, AppSettings } from '@/types'

const DATA_DIR = process.env.DATA_DIR ?? './data'
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

const DEFAULT_SETTINGS: AppSettings = { siteName: 'ChangeLog Hub' }

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readAppConfig(): AppConfig {
  try {
    ensureDir()
    if (!fs.existsSync(CONFIG_FILE)) return { repo: null, settings: DEFAULT_SETTINGS, updatedAt: null }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return {
      repo: parsed.repo ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      updatedAt: parsed.updatedAt ?? null,
    }
  } catch {
    return { repo: null, settings: DEFAULT_SETTINGS, updatedAt: null }
  }
}

export function writeRepo(repo: RepositoryConfig | null): AppConfig {
  ensureDir()
  const current = readAppConfig()
  const cfg: AppConfig = { ...current, repo, updatedAt: new Date().toISOString() }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8')
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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8')
  return cfg
}

// Keep backward compat alias
export { writeRepo as writeAppConfig }
