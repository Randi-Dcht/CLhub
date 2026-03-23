export type ProviderType = 'github' | 'gitlab'

export interface RepositoryConfig {
  provider: ProviderType
  repoUrl: string
  username?: string
  token?: string
  branch?: string
  isPrivate: boolean
}

export interface AppSettings {
  siteName: string
}

export interface AppConfig {
  repo: RepositoryConfig | null
  settings: AppSettings
  updatedAt: string | null
}

export type ChangeType =
  | 'added'
  | 'changed'
  | 'deprecated'
  | 'removed'
  | 'fixed'
  | 'security'
  | 'breaking'

export interface ChangeEntry {
  type: ChangeType
  description: string
}

export interface VersionEntry {
  version: string
  date: string
  changes: ChangeEntry[]
}

export interface FutureFeature {
  title: string
  description: string
  priority?: 'low' | 'medium' | 'high'
  milestone?: string
}

export interface ChangelogFile {
  name: string
  slug: string
  description?: string
  repository?: string
  versions: VersionEntry[]
  upcoming?: FutureFeature[]
  _filePath?: string
  _lastFetched?: string
}

export interface SessionData {
  isAdmin: boolean
}

// ── Subscriptions ──────────────────────────────────────────────

export interface Subscriber {
  id: string          // uuid-like random token
  email: string
  // null = subscribed to ALL apps; string[] = specific slugs
  slugs: string[] | null
  unsubscribeToken: string
  confirmedAt: string | null
  createdAt: string
}

export interface SubscribersStore {
  subscribers: Subscriber[]
}
