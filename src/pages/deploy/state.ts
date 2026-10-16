import type { HFModelInfo } from '../../lib/hf'
import type { ImportSource, WeightFormat } from '../../data/types'
import { GGUF_QUANTS, GPUS, SERVE_QUANTS } from '../../data/architectures'

export interface CodeState {
  kind: 'github' | 'local'
  repo: string
  ref: string
  subdir: string
  token: string
  files: { name: string; size: number; content?: string }[]
  checked: boolean
  checking: boolean
  error?: string
  entrypoint: string
}

export interface WizardState {
  source: ImportSource
  repo: string
  revision: string
  token: string
  info: HFModelInfo | null
  resolvedVia?: 'huggingface' | 'modelscope' | 'hf-mirror' | 'heuristic' | 'cli'
  // cli
  cliName: string
  cliParamsB: number
  cliConfig: string
  // weights
  format: WeightFormat
  ggufQuant: string
  dtype: string
  quantization: string
  // architecture
  arch: string
  newArchName: string
  code: CodeState
  // deploy
  slug: string
  displayName: string
  description: string
  engine: string
  gpu: string
  gpuCount: number
  minReplicas: number
  maxReplicas: number
  scaleToZero: boolean
  contextLength: number
  chatTemplate: string
  visibility: 'private' | 'public'
  priceIn: number
  priceOut: number
}

export const initialState = (source: ImportSource, repo = ''): WizardState => ({
  source,
  repo,
  revision: '',
  token: '',
  info: null,
  cliName: '',
  cliParamsB: 8,
  cliConfig: '',
  format: 'safetensors',
  ggufQuant: '',
  dtype: 'auto',
  quantization: 'none',
  arch: '',
  newArchName: '',
  code: { kind: 'github', repo: '', ref: 'main', subdir: '', token: '', files: [], checked: false, checking: false, entrypoint: 'model.py' },
  slug: '',
  displayName: '',
  description: '',
  engine: 'vLLM',
  gpu: 'H100',
  gpuCount: 1,
  minReplicas: 0,
  maxReplicas: 2,
  scaleToZero: true,
  contextLength: 32768,
  chatTemplate: 'auto',
  visibility: 'private',
  priceIn: 0.2,
  priceOut: 0.8,
})

export type Setter = (patch: Partial<WizardState> | ((s: WizardState) => Partial<WizardState>)) => void

/** 가중치 바이트 수 추정 */
export function weightBytes(s: WizardState, ggufSize?: number): number {
  const params = s.info?.params ?? s.cliParamsB * 1e9
  if (s.format === 'gguf') {
    if (ggufSize) return ggufSize
    const bpw = GGUF_QUANTS[s.ggufQuant] ?? 4.8
    return (params * bpw) / 8
  }
  const q = SERVE_QUANTS.find((x) => x.id === s.quantization)
  let bits = 16
  if (q && q.bits) bits = q.bits
  else if (s.dtype === 'float8_e4m3fn') bits = 8
  else if (s.dtype === 'mxfp4') bits = 4.25
  return (params * bits) / 8
}

/** 필요 VRAM(GB) 추정: 가중치 + 런타임 오버헤드 + KV 캐시 */
export function vramNeededGB(s: WizardState, ggufSize?: number): number {
  const w = weightBytes(s, ggufSize) / 1e9
  const kv = Math.min(40, (s.contextLength / 32768) * Math.max(1.5, w * 0.04))
  return Math.ceil(w * 1.08 + kv + 2)
}

export function recommendGpu(needGB: number): { gpu: string; count: number } {
  for (const count of [1, 2, 4, 8]) {
    for (const g of GPUS) {
      if (g.vram * count * 0.92 >= needGB) return { gpu: g.id, count }
    }
  }
  return { gpu: 'MI355X', count: 8 }
}

export function fitsGpu(gpu: string, count: number, needGB: number) {
  const g = GPUS.find((x) => x.id === gpu)
  return !!g && g.vram * count * 0.92 >= needGB
}

export function hourlyCost(gpu: string, count: number) {
  return (GPUS.find((x) => x.id === gpu)?.price ?? 3) * count
}
