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
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: headers(token) }
  )
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return (data.tree as Array<{ path: string; type: string }>)
    .filter(f => f.type === 'blob')
    .map(f => ({ name: f.path.split('/').pop() ?? f.path, path: f.path }))
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

  // Try provided branch, then main, then master
  const branches = [config.branch || 'main', 'main', 'master'].filter(Boolean)
  const uniqueBranches = [...new Set(branches)]

  let files: Array<{ name: string; path: string }> = []
  let usedBranch = uniqueBranches[0]

  for (const b of uniqueBranches) {
    try {
      files = await fetchTree(owner, repo, b, config.token)
      usedBranch = b
      break
    } catch {
      continue
    }
  }

  const changelogFiles = files.filter(f => isChangelogFile(f.name))
  const results: ChangelogFile[] = []

  for (const file of changelogFiles) {
    try {
      const content = await fetchFileContent(owner, repo, file.path, usedBranch, config.token)
      const parsed = parseChangelogContent(content, file.path)
      if (parsed) results.push(parsed)
    } catch (e) {
      console.warn(`Skip ${file.path}:`, e)
    }
  }

  return results
}
