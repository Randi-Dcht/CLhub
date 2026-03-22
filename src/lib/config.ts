import { RepositoryConfig } from '@/types'

const CONFIG_KEY = 'changelog_repo_config'

export function saveConfig(config: RepositoryConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  }
}

export function loadConfig(): RepositoryConfig | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as RepositoryConfig
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONFIG_KEY)
  }
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.replace(/\.git$/, '').replace(/\/$/, '')
    const match = cleaned.match(/(?:github\.com|gitlab\.com)[/:]([^/]+)\/([^/]+)/)
    if (match) return { owner: match[1], repo: match[2] }
    return null
  } catch {
    return null
  }
}
