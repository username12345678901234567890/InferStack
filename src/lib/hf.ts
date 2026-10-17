/**
 * Hugging Face Hub integration (calls the public API directly from the browser; CORS allowed).
 * If the network is blocked, callers fall back to bundled data.
 */
const HF = 'https://huggingface.co'

export interface HFModelSummary {
  id: string
  likes: number
  downloads: number
  pipeline_tag?: string
  library_name?: string
  createdAt?: string
  tags?: string[]
}

export interface HFSibling {
  path: string
  size?: number
}

export interface HFModelInfo {
  id: string
  author?: string
  sha?: string
  likes: number
  downloads: number
  gated?: boolean | string
  private?: boolean
  pipeline_tag?: string
  library_name?: string
  tags: string[]
  createdAt?: string
  lastModified?: string
  license?: string
  baseModel?: string
  architecture?: string
  modelType?: string
  ggufArchitecture?: string
  contextLength?: number
  params?: number
  chatTemplate?: boolean
  files: HFSibling[]
}

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function getJSON<T>(url: string, token?: string, timeout = 12000): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, { headers: authHeaders(token), signal: ctrl.signal })
    if (!res.ok) {
      const msg = res.headers.get('X-Error-Message') || `${res.status} ${res.statusText}`
      throw new HFError(msg, res.status)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

export class HFError extends Error {
  status: number
  constructor(msg: string, status: number) {
    super(msg)
    this.status = status
  }
}

export async function searchModels(opts: { search?: string; author?: string; pipeline?: string; sort?: string; limit?: number; filter?: string }) {
  const p = new URLSearchParams()
  if (opts.search) p.set('search', opts.search)
  if (opts.author) p.set('author', opts.author)
  if (opts.pipeline) p.set('pipeline_tag', opts.pipeline)
  if (opts.filter) p.set('filter', opts.filter)
  p.set('sort', opts.sort ?? 'trendingScore')
  p.set('limit', String(opts.limit ?? 20))
  return getJSON<HFModelSummary[]>(`${HF}/api/models?${p}`)
}

export async function trendingLLMs(limit = 12) {
  const [a, b] = await Promise.allSettled([
    searchModels({ pipeline: 'text-generation', sort: 'trendingScore', limit: limit * 2 }),
    searchModels({ pipeline: 'image-text-to-text', sort: 'trendingScore', limit }),
  ])
  const all = [...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])]
  if (!all.length) throw new Error('Can’t reach the Hugging Face API')
  return all
    .sort((x, y) => (y.likes ?? 0) - (x.likes ?? 0))
    .filter((m, i, arr) => arr.findIndex((z) => z.id === m.id) === i)
    .slice(0, limit)
}

interface RawInfo {
  id: string
  author?: string
  sha?: string
  likes: number
  downloads: number
  gated?: boolean | string
  private?: boolean
  pipeline_tag?: string
  library_name?: string
  tags?: string[]
  createdAt?: string
  lastModified?: string
  cardData?: { license?: string; base_model?: string | string[] }
  config?: { architectures?: string[]; model_type?: string }
  gguf?: { total?: number; architecture?: string; context_length?: number; chat_template?: string }
  safetensors?: { total?: number }
  siblings?: { rfilename: string }[]
}

interface TreeEntry {
  type: 'file' | 'directory'
  path: string
  size: number
  lfs?: { size: number }
}

export async function getModelInfo(repo: string, opts: { revision?: string; token?: string } = {}): Promise<HFModelInfo> {
  const rev = opts.revision || 'main'
  const raw = await getJSON<RawInfo>(`${HF}/api/models/${repo}${rev !== 'main' ? `/revision/${encodeURIComponent(rev)}` : ''}`, opts.token)

  let files: HFSibling[] = (raw.siblings ?? []).map((s) => ({ path: s.rfilename }))
  try {
    const tree = await getJSON<TreeEntry[]>(`${HF}/api/models/${repo}/tree/${encodeURIComponent(rev)}?recursive=true`, opts.token)
    files = tree.filter((t) => t.type === 'file').map((t) => ({ path: t.path, size: t.lfs?.size ?? t.size }))
  } catch {
    /* fall back to siblings if tree fails */
  }

  let ctx = raw.gguf?.context_length
  let modelType = raw.config?.model_type
  let arch = raw.config?.architectures?.[0]
  let chatTemplate = !!raw.gguf?.chat_template
  if (files.some((f) => f.path === 'config.json')) {
    try {
      const cfg = await getJSON<Record<string, unknown>>(`${HF}/${repo}/resolve/${encodeURIComponent(rev)}/config.json`, opts.token)
      const text = (cfg.text_config as Record<string, unknown>) ?? cfg
      ctx = (text.max_position_embeddings as number) ?? (cfg.max_position_embeddings as number) ?? ctx
      modelType = (cfg.model_type as string) ?? modelType
      arch = (cfg.architectures as string[] | undefined)?.[0] ?? arch
    } catch {
      /* ignore */
    }
  }
  if (files.some((f) => f.path === 'tokenizer_config.json' || f.path === 'chat_template.jinja')) chatTemplate = true

  const base = raw.cardData?.base_model
  return {
    id: raw.id,
    author: raw.author,
    sha: raw.sha,
    likes: raw.likes,
    downloads: raw.downloads,
    gated: raw.gated,
    private: raw.private,
    pipeline_tag: raw.pipeline_tag,
    library_name: raw.library_name,
    tags: raw.tags ?? [],
    createdAt: raw.createdAt,
    lastModified: raw.lastModified,
    license: raw.cardData?.license,
    baseModel: Array.isArray(base) ? base[0] : base,
    architecture: arch,
    modelType,
    ggufArchitecture: raw.gguf?.architecture,
    contextLength: ctx,
    params: raw.safetensors?.total ?? raw.gguf?.total,
    chatTemplate,
    files,
  }
}

export interface GGUFVariant {
  quant: string
  files: HFSibling[]
  size: number
  label: string
}

const QUANT_RE = /(?:^|[-_.])((?:UD-)?(?:IQ\d_[A-Z]+|Q\d_K_[SML]|Q\d_K|Q\d_\d|Q\d_[01]|TQ\d_\d|BF16|F16|F32|MXFP4(?:_MOE)?))(?=[-_.])/i

/** Group GGUF files by quant type (supports split files -00001-of-0000N) */
export function groupGGUF(files: HFSibling[]): GGUFVariant[] {
  const ggufs = files.filter((f) => f.path.toLowerCase().endsWith('.gguf') && !/mmproj/i.test(f.path))
  const map = new Map<string, HFSibling[]>()
  for (const f of ggufs) {
    const base = f.path.split('/').pop() ?? f.path
    const m = base.match(QUANT_RE)
    const quant = (m?.[1] ?? 'unknown').toUpperCase()
    const key = quant
    map.set(key, [...(map.get(key) ?? []), f])
  }
  return Array.from(map.entries())
    .map(([quant, fs]) => ({
      quant,
      files: fs.sort((a, b) => a.path.localeCompare(b.path)),
      size: fs.reduce((s, f) => s + (f.size ?? 0), 0),
      label: fs.length > 1 ? `${fs[0].path.replace(/-0+1-of-\d+/, '')} (${fs.length} parts)` : fs[0].path,
    }))
    .sort((a, b) => b.size - a.size)
}

export function safetensorsFiles(files: HFSibling[]) {
  return files.filter((f) => f.path.endsWith('.safetensors'))
}

export function detectFormats(files: HFSibling[]): ('gguf' | 'safetensors')[] {
  const out: ('gguf' | 'safetensors')[] = []
  if (safetensorsFiles(files).length) out.push('safetensors')
  if (groupGGUF(files).length) out.push('gguf')
  return out
}

export function hfUrl(repo: string) {
  return `${HF}/${repo}`
}
