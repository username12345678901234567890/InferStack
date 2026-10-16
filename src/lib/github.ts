/**
 * GitHub 공개 리포지토리에서 커스텀 추론 코드 구조를 검증합니다.
 * (api.github.com 은 CORS를 허용하므로 브라우저에서 직접 호출)
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
    if (res.status === 404) return { ok: false, files: [], error: '리포지토리 또는 경로를 찾을 수 없습니다 (비공개라면 토큰을 입력하세요)' }
    if (res.status === 403) return { ok: false, files: [], error: 'GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요' }
    if (!res.ok) return { ok: false, files: [], error: `GitHub API 오류: ${res.status}` }
    const j = await res.json()
    if (!Array.isArray(j)) return { ok: false, files: [], error: '경로가 디렉터리가 아닙니다' }
    return { ok: true, files: j.filter((f: { type: string }) => f.type === 'file').map((f: { name: string; size: number }) => ({ name: f.name, size: f.size })) }
  } catch {
    return { ok: false, files: [], error: 'GitHub에 연결할 수 없습니다 (네트워크)' }
  }
}
