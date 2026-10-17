import { getModelInfo, type HFModelInfo, type HFSibling } from './hf'
import { guessArchFromName } from '../data/architectures'
import { rng } from './rand'

/**
 * ModelScope 연동 (데모).
 * ModelScope OpenAPI는 브라우저 CORS를 허용하지 않으므로 실제 서비스에서는
 * InferStack 백엔드가 프록시합니다. 데모에서는
 *   1) ModelScope API 직접 시도 →
 *   2) 동일 ID의 Hugging Face 미러 메타데이터 →
 *   3) 이름 기반 추정
 * 순서로 메타데이터를 구성합니다.
 */
export interface MSResult {
  info: HFModelInfo
  resolvedVia: 'modelscope' | 'hf-mirror' | 'heuristic'
}

/** ModelScope 조직명 → Hugging Face 조직명 (HF 미러 메타데이터 조회용) */
const MS_TO_HF_ORG: Record<string, string> = {
  ZhipuAI: 'zai-org',
  'deepseek-ai': 'deepseek-ai',
  moonshotai: 'moonshotai',
  MiniMax: 'MiniMaxAI',
  XiaomiMiMo: 'XiaomiMiMo',
  LLM_Research: 'meta-llama',
  OpenBMB: 'openbmb',
  stepfun: 'stepfun-ai',
  Tencent_Hunyuan: 'tencent',
  inclusionAI: 'inclusionAI',
}

function hfMirrorId(repo: string) {
  const [org, name] = repo.split('/')
  return `${MS_TO_HF_ORG[org] ?? org}/${name}`
}

export async function getModelScopeInfo(repo: string, revision = 'master'): Promise<MSResult> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(`https://modelscope.cn/api/v1/models/${repo}/repo/files?Revision=${revision}&Recursive=true`, { signal: ctrl.signal })
    clearTimeout(t)
    if (res.ok) {
      const j = await res.json()
      const files: HFSibling[] = (j?.Data?.Files ?? []).filter((f: { Type: string }) => f.Type === 'blob').map((f: { Path: string; Size: number }) => ({ path: f.Path, size: f.Size }))
      if (files.length) {
        return { resolvedVia: 'modelscope', info: { ...emptyInfo(repo), files, architecture: guessArchFromName(repo) } }
      }
    }
  } catch {
    /* CORS / network — fall through */
  }
  try {
    const info = await getModelInfo(hfMirrorId(repo))
    return { info: { ...info, id: repo }, resolvedVia: 'hf-mirror' }
  } catch {
    /* fall through */
  }
  return { info: heuristicInfo(repo), resolvedVia: 'heuristic' }
}

function emptyInfo(repo: string): HFModelInfo {
  return { id: repo, likes: 0, downloads: 0, tags: [], files: [], author: repo.split('/')[0] }
}

function heuristicInfo(repo: string): HFModelInfo {
  const r = rng(repo)
  const isGGUF = /gguf/i.test(repo)
  const size = parseSize(repo) ?? 7e9
  const base = repo.split('/').pop() ?? repo
  let files: HFSibling[]
  if (isGGUF) {
    const name = base.replace(/-?gguf/i, '')
    files = ['Q8_0', 'Q6_K', 'Q5_K_M', 'Q4_K_M', 'Q3_K_M', 'Q2_K'].map((q) => ({
      path: `${name}-${q}.gguf`,
      size: Math.round(size * ({ Q8_0: 8.5, Q6_K: 6.6, Q5_K_M: 5.7, Q4_K_M: 4.8, Q3_K_M: 3.9, Q2_K: 3 } as Record<string, number>)[q] / 8),
    }))
  } else {
    const shardBytes = 4.9e9
    const total = size * 2
    const n = Math.max(1, Math.ceil(total / shardBytes))
    files = [
      { path: 'config.json', size: 1400 },
      { path: 'generation_config.json', size: 210 },
      { path: 'tokenizer.json', size: 11_400_000 },
      { path: 'tokenizer_config.json', size: 9800 },
      { path: 'model.safetensors.index.json', size: 60_000 },
      ...Array.from({ length: n }, (_, i) => ({ path: `model-${String(i + 1).padStart(5, '0')}-of-${String(n).padStart(5, '0')}.safetensors`, size: Math.round(total / n) })),
    ]
  }
  return {
    ...emptyInfo(repo),
    likes: Math.round(r() * 400),
    downloads: Math.round(r() * 50000),
    architecture: isGGUF ? undefined : guessArchFromName(repo),
    contextLength: 32768,
    params: size,
    license: 'apache-2.0',
    chatTemplate: true,
    files,
  }
}

function parseSize(repo: string): number | undefined {
  const m = repo.match(/(\d+(?:\.\d+)?)\s*([BbTt])(?![a-z])/)
  if (!m) return undefined
  return parseFloat(m[1]) * (m[2].toLowerCase() === 't' ? 1e12 : 1e9)
}
