/**
 * Validates the custom inference code layout in a public GitHub repository.
 * (api.github.com allows CORS, so it's called directly from the browser)
 */
export interface RepoCheck {
  ok: boolean
  files: { name: string; size: number }[]
  error?: string
  defaultBranch?: string
}

export function parseGithubUrl(input: string): { owner: string; repo: string } | null {
  const s = input.trim().replace(/\.git$/, '')
  const m = s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/) || s.match(/^([\w.-]+)\/([\w.-]+)$/)
  return m ? { owner: m[1], repo: m[2] } : null
}

export async function listRepoDir(owner: string, repo: string, ref: string, subdir: string, token?: string): Promise<RepoCheck> {
  const path = subdir.replace(/^\/+|\/+$/g, '')
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    if (res.status === 404) return { ok: false, files: [], error: 'Repository or path not found (add a token if it’s private)' }
    if (res.status === 403) return { ok: false, files: [], error: 'GitHub API rate limit exceeded. Try again shortly' }
    if (!res.ok) return { ok: false, files: [], error: `GitHub API error: ${res.status}` }
    const j = await res.json()
    if (!Array.isArray(j)) return { ok: false, files: [], error: 'Path is not a directory' }
    return { ok: true, files: j.filter((f: { type: string }) => f.type === 'file').map((f: { name: string; size: number }) => ({ name: f.name, size: f.size })) }
  } catch {
    return { ok: false, files: [], error: 'Can’t reach GitHub (network error)' }
  }
}
