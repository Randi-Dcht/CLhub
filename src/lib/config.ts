/**
 * Client-side helpers only.
 * Server config is managed through /api/admin/* routes and src/lib/store.ts
 */

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.replace(/\.git$/, '').replace(/\/$/, '')
    const match = cleaned.match(/(?:github\.com|gitlab\.com)[/:]([^/:]*)\/([^/?#]*)/)
    if (match) return { owner: match[1], repo: match[2] }
    return null
  } catch {
    return null
  }
}
