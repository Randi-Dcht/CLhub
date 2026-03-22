import yaml from 'js-yaml'
import { ChangelogFile, VersionEntry, ChangeEntry, FutureFeature, ChangeType } from '@/types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const VALID_TYPES: ChangeType[] = [
  'added', 'changed', 'deprecated', 'removed', 'fixed', 'security', 'breaking',
]

function toChangeType(raw: unknown): ChangeType {
  if (typeof raw === 'string' && (VALID_TYPES as string[]).includes(raw)) {
    return raw as ChangeType
  }
  return 'changed'
}

export function parseChangelogContent(content: string, filePath: string): ChangelogFile | null {
  try {
    let data: Record<string, unknown>

    // Try JSON first if .json extension
    if (filePath.endsWith('.json')) {
      data = JSON.parse(content) as Record<string, unknown>
    } else {
      data = yaml.load(content) as Record<string, unknown>
    }

    if (!data || typeof data !== 'object') return null

    const name = (data.name as string) || filePath.split('/').pop()?.replace(/\.(ya?ml|json)$/i, '') || 'App'
    const slug = slugify(name)

    const versions: VersionEntry[] = []
    const rawVersions = data.versions

    if (Array.isArray(rawVersions)) {
      for (const v of rawVersions) {
        if (!v || typeof v !== 'object') continue
        const vObj = v as Record<string, unknown>
        const changes: ChangeEntry[] = []
        const rawChanges = vObj.changes

        if (Array.isArray(rawChanges)) {
          for (const c of rawChanges) {
            if (!c || typeof c !== 'object') continue
            const cObj = c as Record<string, unknown>
            changes.push({
              type: toChangeType(cObj.type),
              description: String(cObj.description || ''),
            })
          }
        }

        versions.push({
          version: String(vObj.version ?? '0.0.0'),
          date: String(vObj.date ?? ''),
          changes,
        })
      }
    }

    const upcoming: FutureFeature[] = []
    const rawUpcoming = data.upcoming

    if (Array.isArray(rawUpcoming)) {
      for (const f of rawUpcoming) {
        if (!f || typeof f !== 'object') continue
        const fObj = f as Record<string, unknown>
        const priority = fObj.priority as string
        upcoming.push({
          title: String(fObj.title ?? ''),
          description: String(fObj.description ?? ''),
          priority: ['low', 'medium', 'high'].includes(priority)
            ? (priority as 'low' | 'medium' | 'high')
            : undefined,
          milestone: fObj.milestone ? String(fObj.milestone) : undefined,
        })
      }
    }

    return {
      name,
      slug,
      description: data.description ? String(data.description) : undefined,
      repository: data.repository ? String(data.repository) : undefined,
      versions,
      upcoming: upcoming.length > 0 ? upcoming : undefined,
      _filePath: filePath,
      _lastFetched: new Date().toISOString(),
    }
  } catch (err) {
    console.error(`Failed to parse changelog [${filePath}]:`, err)
    return null
  }
}

export function isChangelogFile(filename: string): boolean {
  return /changelog/i.test(filename) && /\.(ya?ml|json)$/i.test(filename)
}
