import { RepositoryConfig, ChangelogFile } from '@/types'
import { parseChangelogContent, isChangelogFile } from './parser'
import { parseRepoUrl } from './config'

const GITHUB_API = 'https://api.github.com'

function headers(token?: string): HeadersInit {
  const h: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ChangelogHub/1.0',
  }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function fetchTree(owner: string, repo: string, branch: string, token?: string) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  console.log(`[github] fetchTree: ${url}`)
  const res = await fetch(url, { headers: headers(token) })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub tree ${res.status} on branch "${branch}": ${body.slice(0, 120)}`)
  }
  const data = await res.json()
  const files = (data.tree as Array<{ path: string; type: string }>)
    .filter(f => f.type === 'blob')
    .map(f => ({ name: f.path.split('/').pop() ?? f.path, path: f.path }))
  console.log(`[github] tree has ${files.length} blobs, ${files.filter(f => isChangelogFile(f.name)).length} changelogs`)
  return files
}

async function fetchFileContent(owner: string, repo: string, filePath: string, branch: string, token?: string): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    { headers: headers(token) }
  )
  if (!res.ok) throw new Error(`Cannot fetch ${filePath}: ${res.status}`)
  const data = await res.json()
  return Buffer.from(data.content as string, 'base64').toString('utf-8')
}

export async function validateGitHub(config: RepositoryConfig) {
  const parsed = parseRepoUrl(config.repoUrl)
  if (!parsed) throw new Error('URL de dépôt invalide')
  const { owner, repo } = parsed
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: headers(config.token) })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Token invalide ou expiré')
    if (res.status === 404) throw new Error('Dépôt introuvable ou accès refusé')
    throw new Error(`Erreur GitHub: ${res.status}`)
  }
  const data = await res.json()
  return {
    name: data.full_name as string,
    description: (data.description as string) ?? '',
    default_branch: data.default_branch as string,
  }
}

export async function fetchGitHubChangelogs(config: RepositoryConfig): Promise<ChangelogFile[]> {
  const parsed = parseRepoUrl(config.repoUrl)
  if (!parsed) throw new Error('URL invalide')
  const { owner, repo } = parsed

  console.log(`[github] fetchChangelogs for ${owner}/${repo}`)

  // Build branch list: configured branch first, then common defaults
  const configured = config.branch?.trim()
  const candidates = configured
    ? [configured, 'main', 'master', 'develop']
    : ['main', 'master', 'develop']
  const uniqueBranches = candidates.filter((b, i, arr) => arr.indexOf(b) === i)

  let files: Array<{ name: string; path: string }> = []
  let usedBranch = uniqueBranches[0]
  let lastError = ''

  for (const b of uniqueBranches) {
    try {
      files = await fetchTree(owner, repo, b, config.token)
      usedBranch = b
      console.log(`[github] using branch: ${b}`)
      break
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      console.warn(`[github] branch "${b}" failed:`, lastError)
    }
  }

  if (files.length === 0) {
    throw new Error(`Impossible d'accéder au dépôt sur les branches ${uniqueBranches.join(', ')}. Dernière erreur: ${lastError}`)
  }

  const changelogFiles = files.filter(f => isChangelogFile(f.name))
  console.log(`[github] changelog files found: ${changelogFiles.map(f => f.path).join(', ') || 'NONE'}`)

  if (changelogFiles.length === 0) {
    console.warn('[github] No changelog files found. Files in repo:', files.map(f => f.path).slice(0, 20).join(', '))
  }

  const results: ChangelogFile[] = []

  for (const file of changelogFiles) {
    try {
      const content = await fetchFileContent(owner, repo, file.path, usedBranch, config.token)
      const parsed = parseChangelogContent(content, file.path)
      if (parsed) {
        console.log(`[github] parsed: ${parsed.name} (${parsed.versions.length} versions)`)
        results.push(parsed)
      } else {
        console.warn(`[github] parse returned null for: ${file.path}`)
      }
    } catch (e) {
      console.warn(`[github] skip ${file.path}:`, e)
    }
  }

  return results
}
