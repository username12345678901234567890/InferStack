export type Modality = 'text' | 'image' | 'audio' | 'video'
export type Capability = 'reasoning' | 'tools' | 'vision' | 'coding' | 'agent' | 'long-context' | 'multilingual' | 'json'

export interface Endpoint {
  id: string
  region: string
  location: string
  gpu: string
  quant: string
  /** multiplier applied to the base price */
  priceMul: number
  throughput: number // tokens/sec
  latency: number // ms, time to first token
  uptime: number // %
  maxOutput: number
}

export interface CatalogModel {
  slug: string // e.g. deepseek/deepseek-v4.1-flash
  name: string
  org: string
  orgName: string
  hfId: string
  architecture: string
  params: number
  activeParams?: number
  context: number
  license: string
  released: string
  input: Modality[]
  output: Modality[]
  capabilities: Capability[]
  price: { input: number; output: number; cachedInput?: number } // USD / 1M tokens
  free?: boolean
  isNew?: boolean
  preview?: boolean
  description: string
  hfLikes: number
  hfDownloads: number
  custom?: boolean
  owner?: string
}

export type WeightFormat = 'gguf' | 'safetensors'
export type ImportSource = 'huggingface' | 'modelscope' | 'cli'

export interface CustomCode {
  kind: 'github' | 'local'
  repo?: string
  ref?: string
  subdir?: string
  files?: { name: string; size: number }[]
  entrypoint: string
  validated: boolean
}

export type CustomModelStatus = 'awaiting_upload' | 'queued' | 'building' | 'live' | 'paused' | 'failed'

export interface CustomModel {
  id: string
  slug: string
  displayName: string
  description: string
  source: ImportSource
  sourceRepo?: string
  revision?: string
  format: WeightFormat
  weightFile?: string
  dtype?: string
  quantization?: string
  architecture: string
  newArchitecture: boolean
  customCode?: CustomCode
  engine: string
  gpu: string
  gpuCount: number
  minReplicas: number
  maxReplicas: number
  scaleToZero: boolean
  contextLength: number
  chatTemplate: string
  visibility: 'private' | 'public'
  price: { input: number; output: number }
  params?: number
  sizeBytes?: number
  createdAt: number
  buildDuration: number // ms (demo simulation)
  status: CustomModelStatus
  pausedAt?: number
}

export interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: number
  lastUsed?: number
  limit?: number | null
  usage: number
  expiresAt?: number | null
  disabled: boolean
  allowedModels: string[] // empty = all
}

export interface ActivityLog {
  id: string
  ts: number
  model: string
  keyName: string
  endpoint: string
  promptTokens: number
  completionTokens: number
  cost: number
  latency: number
  throughput: number
  finish: 'stop' | 'length' | 'tool_calls' | 'error'
  source: 'playground' | 'api'
}

export interface Transaction {
  id: string
  ts: number
  amount: number
  kind: 'purchase' | 'bonus' | 'usage' | 'payout'
  note: string
}
