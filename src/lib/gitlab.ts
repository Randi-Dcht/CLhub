import { RepositoryConfig, ChangelogFile } from '@/types'
import { parseChangelogContent, isChangelogFile } from './parser'
import { parseRepoUrl } from './config'

// Always bypass Next.js fetch cache — repo content changes at any time
const NO_CACHE: RequestInit = { cache: 'no-store' }

function glBase(repoUrl: string): string {
  try {
    const u = new URL(repoUrl)
    return `${u.protocol}//${u.host}/api/v4`
  } catch {
    return 'https://gitlab.com/api/v4'
  }
}

function makeHeaders(token?: string): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) h['PRIVATE-TOKEN'] = token
  return h
}

export async function validateGitLab(config: RepositoryConfig) {
  const parsed = parseRepoUrl(config.repoUrl)
  if (!parsed) throw new Error('URL de dépôt invalide')
  const { owner, repo } = parsed
  const base = glBase(config.repoUrl)
  const projectPath = encodeURIComponent(`${owner}/${repo}`)

  const res = await fetch(
    `${base}/projects/${projectPath}`,
    { ...NO_CACHE, headers: makeHeaders(config.token) },
  )
  if (!res.ok) {
    if (res.status === 401) throw new Error('Token invalide ou expiré')
    if (res.status === 404) throw new Error('Projet introuvable ou accès refusé')
    throw new Error(`Erreur GitLab: ${res.status}`)
  }
  const data = await res.json()
  return {
    name: data.path_with_namespace as string,
    description: (data.description as string) ?? '',
    default_branch: data.default_branch as string,
  }
}

export async function fetchGitLabChangelogs(config: RepositoryConfig): Promise<ChangelogFile[]> {
  const parsed = parseRepoUrl(config.repoUrl)
  if (!parsed) throw new Error('URL invalide')
  const { owner, repo } = parsed
  const base = glBase(config.repoUrl)
  const projectPath = encodeURIComponent(`${owner}/${repo}`)

  console.log(`[gitlab] fetchChangelogs for ${owner}/${repo}`)

  const res = await fetch(
    `${base}/projects/${projectPath}/repository/tree?recursive=true&per_page=100`,
    { ...NO_CACHE, headers: makeHeaders(config.token) },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitLab tree ${res.status}: ${body.slice(0, 120)}`)
  }

  const tree = (await res.json()) as Array<{ name: string; path: string; type: string }>
  const changelogFiles = tree.filter(f => f.type === 'blob' && isChangelogFile(f.name))
  console.log(
    `[gitlab] changelog files: ${changelogFiles.map(f => f.path).join(', ') || 'NONE'}`,
  )

  const branch = config.branch?.trim() || 'main'
  const results: ChangelogFile[] = []

  for (const file of changelogFiles) {
    try {
      const encodedPath = encodeURIComponent(file.path)
      const fRes = await fetch(
        `${base}/projects/${projectPath}/repository/files/${encodedPath}/raw?ref=${branch}`,
        { ...NO_CACHE, headers: makeHeaders(config.token) },
      )
      if (!fRes.ok) {
        console.warn(`[gitlab] cannot fetch ${file.path}: ${fRes.status}`)
        continue
      }
      const content = await fRes.text()
      const cl = parseChangelogContent(content, file.path)
      if (cl) {
        console.log(`[gitlab] parsed: ${cl.name} (${cl.versions.length} versions)`)
        results.push(cl)
      } else {
        console.warn(`[gitlab] parse returned null for: ${file.path}`)
      }
    } catch (e) {
      console.warn(`[gitlab] skip ${file.path}:`, e)
    }
  }

  return results
}
