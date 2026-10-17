import type { CatalogModel, Capability, Endpoint, Modality } from './types'
import { rng } from '../lib/rand'
import { MISTRAL3_ARCH } from './architectures'

/**
 * Supported model catalog.
 * Metadata (architecture / params / context / license / release date) comes from the
 * Hugging Face Hub API (config.json, safetensors metadata) as of 2026-10.
 * Prices are InferStack demo prices (USD per 1M tokens).
 */

type Row = [
  slug: string,
  name: string,
  hfId: string,
  arch: string,
  params: number,
  active: number | undefined,
  ctx: number,
  license: string,
  released: string,
  input: Modality[],
  caps: Capability[],
  priceIn: number,
  priceOut: number,
  likes: number,
  downloads: number,
  description: string,
  flags?: { free?: boolean; isNew?: boolean; preview?: boolean },
]

const T: Modality[] = ['text']
const TI: Modality[] = ['text', 'image']
const TIA: Modality[] = ['text', 'image', 'audio']

const ROWS: Row[] = [
  ['deepseek/deepseek-v4.1-flash', 'DeepSeek V4.1 Flash', 'deepseek-ai/DeepSeek-V4.1-Flash', 'DeepseekV41ForCausalLM', 763.2e9, undefined, 1048576, 'mit', '2026-09-10', TI, ['reasoning', 'tools', 'vision', 'long-context', 'coding'], 0.28, 1.1, 4556, 1276459,
    'The latest Flash update in the DeepSeek V4 line. A large MoE with 1M context and image input. Good value for agents and coding, and a sensible default.', { isNew: true }],
  ['deepseek/deepseek-v4-pro', 'DeepSeek V4 Pro (0813)', 'deepseek-ai/DeepSeek-V4-Pro-0813', 'DeepseekV4ForCausalLM', 1650.5e9, undefined, 1048576, 'mit', '2026-08-13', T, ['reasoning', 'tools', 'long-context', 'coding', 'agent'], 0.85, 3.4, 897, 157814,
    'DeepSeek V4\'s flagship Pro checkpoint (0813). A 1.65T-parameter MoE tuned for hard reasoning and long-context work.'],
  ['deepseek/deepseek-v4-flash-vision-exp', 'DeepSeek V4 Flash Vision (Exp)', 'deepseek-ai/DeepSeek-V4-Flash-Vision-Exp', 'DeepseekV4ForCausalLM', 304.6e9, undefined, 1048576, 'mit', '2026-08-31', TI, ['vision', 'tools', 'long-context'], 0.18, 0.7, 952, 480973,
    'Experimental vision-language model built on DeepSeek V4 Flash. Specialized in documents, charts and screenshots.', { preview: true }],
  ['deepseek/deepseek-v3.2', 'DeepSeek V3.2', 'deepseek-ai/DeepSeek-V3.2', 'DeepseekV32ForCausalLM', 685.4e9, 37e9, 163840, 'mit', '2025-12-01', T, ['reasoning', 'tools', 'coding'], 0.26, 0.4, 1580, 4972497,
    'DeepSeek V3.2 with sparse attention (DSA). Stable, cheap and still one of the most used models.'],

  ['qwen/qwen3.8-2.4t-a95b', 'Qwen3.8 2.4T A95B', 'Qwen/Qwen3.8-2.4T-A95B', 'Qwen3_5MoeForCausalLM', 2446.2e9, 95e9, 262144, 'qwen', '2026-08-08', T, ['reasoning', 'tools', 'multilingual', 'coding', 'agent'], 1.2, 4.8, 1313, 31991,
    'The largest Qwen ever: a 2.4T-parameter MoE with 95B active. Flagship open-weight reasoning and multilingual quality.'],
  ['qwen/qwen3.8-flash-next', 'Qwen3.8 Flash Next', 'Qwen/Qwen3.8-Flash-Next', 'Qwen4ExpForConditionalGeneration', 180e9, undefined, 262144, 'qwen', '2026-08-24', TI, ['vision', 'tools', 'multilingual', 'agent'], 0.15, 0.6, 6271, 2379596,
    'Fast multimodal model on the experimental Qwen4 architecture. Built for low-latency, high-throughput production traffic.', { isNew: true }],
  ['qwen/qwen3.8-27b', 'Qwen3.8 27B', 'Qwen/Qwen3.8-27B', 'Qwen3_5ForConditionalGeneration', 27.8e9, undefined, 262144, 'apache-2.0', '2026-08-05', TI, ['vision', 'tools', 'reasoning', 'multilingual'], 0.08, 0.32, 17830, 7516626,
    'The most popular open model on Hugging Face. A 27B dense multimodal model, widely used for single-GPU serving and as a fine-tuning base.', { free: true }],
  ['qwen/qwen3-coder-next', 'Qwen3 Coder Next', 'Qwen/Qwen3-Coder-Next', 'Qwen3NextForCausalLM', 79.7e9, 3e9, 262144, 'apache-2.0', '2026-01-30', T, ['coding', 'tools', 'agent', 'long-context'], 0.14, 0.55, 1698, 515484,
    'Coding agent model on Qwen3-Next hybrid attention. Strong at repository-scale code understanding and tool calls.'],
  ['qwen/qwen-agentworld-35b-a3b', 'Qwen AgentWorld 35B A3B', 'Qwen/Qwen-AgentWorld-35B-A3B', 'Qwen3_5MoeForConditionalGeneration', 34.7e9, 3e9, 262144, 'apache-2.0', '2026-06-22', T, ['agent', 'tools', 'json'], 0.07, 0.28, 739, 7444,
    'Lightweight MoE trained in agent environments. Good for multi-step tool use and structured output.'],

  ['z-ai/glm-5.3', 'GLM-5.3', 'zai-org/GLM-5.3', 'GlmMoeDsaForCausalLM', 753.3e9, undefined, 1048576, 'other', '2026-08-25', T, ['reasoning', 'coding', 'agent', 'tools', 'long-context'], 0.6, 2.2, 2235, 1833879,
    'Z.ai\'s latest GLM-5.3. A 1M-context DSA MoE at the top of agentic coding benchmarks.', { isNew: true }],
  ['z-ai/glm-5.2', 'GLM-5.2', 'zai-org/GLM-5.2', 'GlmMoeDsaForCausalLM', 753.3e9, undefined, 1048576, 'mit', '2026-06-16', T, ['reasoning', 'coding', 'agent', 'tools', 'long-context'], 0.55, 2.0, 5182, 480170,
    'GLM-5.2 under the MIT license. Few commercial restrictions, widely adopted by enterprises.'],
  ['z-ai/glm-4.7-flash', 'GLM-4.7 Flash', 'zai-org/GLM-4.7-Flash', 'Glm4MoeLiteForCausalLM', 31.2e9, undefined, 202752, 'mit', '2026-01-19', T, ['tools', 'coding', 'multilingual'], 0.06, 0.4, 1879, 1260693,
    'The lightweight Flash version of GLM-4.7. Fast and cheap. Use it for classification, summarization and RAG.', { free: true }],

  ['moonshotai/kimi-k3', 'Kimi K3', 'moonshotai/Kimi-K3', 'KimiK3ForConditionalGeneration', 2779.9e9, undefined, 1048576, 'modified-mit', '2026-06-13', TI, ['reasoning', 'agent', 'tools', 'vision', 'long-context', 'coding'], 1.0, 4.0, 11743, 1052786,
    'Moonshot AI\'s 2.8T-parameter multimodal agent model. Long-horizon autonomous tasks with 1M context.'],
  ['moonshotai/kimi-k2.7-code', 'Kimi K2.7 Code', 'moonshotai/Kimi-K2.7-Code', 'KimiK25ForConditionalGeneration', 1026.9e9, 32e9, 262144, 'modified-mit', '2026-06-11', TI, ['coding', 'agent', 'tools'], 0.6, 2.5, 1419, 113251,
    'Coding checkpoint of the Kimi K2.x line. Strong at screenshot-to-frontend and SWE agent tasks.'],
  ['moonshotai/kimi-k2.6', 'Kimi K2.6', 'moonshotai/Kimi-K2.6', 'KimiK25ForConditionalGeneration', 1026.9e9, 32e9, 262144, 'modified-mit', '2026-04-14', TI, ['agent', 'tools', 'vision', 'reasoning'], 0.55, 2.3, 1630, 389201,
    'A 1T-parameter multimodal MoE. Excellent agent-swarm behavior and reliable tool calling.'],

  ['minimax/minimax-m2.7', 'MiniMax M2.7', 'MiniMaxAI/MiniMax-M2.7', 'MiniMaxM2ForCausalLM', 228.7e9, 10e9, 204800, 'other', '2026-04-09', T, ['coding', 'agent', 'tools'], 0.3, 1.2, 1256, 615924,
    'Agentic coding model with few active parameters, so it is fast and cheap. Supports interleaved thinking.'],

  ['xiaomi/mimo-v2.6-pro', 'MiMo V2.6 Pro', 'XiaomiMiMo/MiMo-V2.6-Pro-RL', 'MiMoV2ForCausalLM', 1024.2e9, undefined, 1048576, 'mit', '2026-09-21', T, ['reasoning', 'coding', 'tools', 'long-context'], 0.7, 2.8, 736, 100156,
    'Xiaomi MiMo V2.6 Pro RL checkpoint. A 1T-class model with math and coding reasoning boosted by RL.', { isNew: true }],
  ['xiaomi/mimo-v2.6-flash', 'MiMo V2.6 Flash', 'XiaomiMiMo/MiMo-V2.6-Flash-RL', 'MiMoV2ForCausalLM', 310.8e9, undefined, 1048576, 'mit', '2026-09-21', T, ['reasoning', 'coding', 'tools'], 0.12, 0.5, 561, 92057,
    'The fast Flash version of MiMo V2.6. Very high throughput for its reasoning quality.', { isNew: true }],

  ['google/gemma-4-31b-it', 'Gemma 4 31B', 'google/gemma-4-31B-it', 'Gemma4ForConditionalGeneration', 31.3e9, undefined, 262144, 'apache-2.0', '2026-03-11', TI, ['vision', 'multilingual', 'tools'], 0.1, 0.3, 4134, 9088689,
    'Google\'s largest dense Gemma 4. Apache-2.0, widely used on-prem and for fine-tuning.'],
  ['google/gemma-4-26b-a4b-it', 'Gemma 4 26B A4B', 'google/gemma-4-26B-A4B-it', 'Gemma4ForConditionalGeneration', 25.8e9, 4e9, 262144, 'apache-2.0', '2026-03-11', TI, ['vision', 'multilingual', 'tools'], 0.07, 0.25, 1659, 10951317,
    'Gemma 4 MoE. Very fast with 4B active, and one of the most downloaded models in real use.'],
  ['google/gemma-4-12b-it', 'Gemma 4 12B', 'google/gemma-4-12B-it', 'Gemma4UnifiedForConditionalGeneration', 12e9, undefined, 262144, 'apache-2.0', '2026-05-23', TIA, ['vision', 'multilingual'], 0.04, 0.12, 1666, 1656973,
    'Gemma 4 Unified 12B: text, image and audio input in a single model.', { free: true }],

  ['mistralai/mistral-medium-3.5', 'Mistral Medium 3.5', 'mistralai/Mistral-Medium-3.5-128B', MISTRAL3_ARCH, 127.7e9, undefined, 262144, 'mistral-research', '2026-03-31', TI, ['tools', 'vision', 'multilingual', 'coding'], 0.4, 1.6, 485, 74114,
    'A 128B dense multimodal model. Strong on European languages and enterprise documents.'],
  ['mistralai/mistral-small-4', 'Mistral Small 4 (2603)', 'mistralai/Mistral-Small-4-119B-2603', MISTRAL3_ARCH, 119.4e9, undefined, 1048576, 'apache-2.0', '2026-01-23', TI, ['tools', 'vision', 'long-context', 'json'], 0.2, 0.6, 452, 73570,
    'Apache-2.0 Mistral Small 4. A general-purpose model with 1M context and function calling.'],

  ['openai/gpt-oss-120b', 'gpt-oss-120b', 'openai/gpt-oss-120b', 'GptOssForCausalLM', 116.8e9, 5.1e9, 131072, 'apache-2.0', '2025-08-04', T, ['reasoning', 'tools', 'json'], 0.05, 0.25, 5411, 3362048,
    'OpenAI\'s open-weight reasoning model. Native MXFP4, runs on a single H100, with adjustable reasoning effort.'],
  ['openai/gpt-oss-20b', 'gpt-oss-20b', 'openai/gpt-oss-20b', 'GptOssForCausalLM', 20.9e9, 3.6e9, 131072, 'apache-2.0', '2025-08-04', T, ['reasoning', 'tools'], 0.03, 0.14, 5186, 5956790,
    'The small gpt-oss. Low-latency reasoning that runs on edge and local-class hardware.', { free: true }],

  ['liquid/lfm2.5-24b-a2b', 'LFM2.5 24B A2B', 'LiquidAI/LFM2.5-24B-A2B', 'Lfm2MoeForCausalLM', 24e9, 2e9, 131072, 'lfm-open', '2026-10-12', T, ['tools', 'multilingual'], 0.03, 0.12, 412, 9356,
    'Liquid AI\'s hybrid (convolution + attention) MoE. Very low latency with 2B active parameters. Currently trending on Hugging Face.', { isNew: true }],
  ['inclusionai/ling-3.1-flash', 'Ling 3.1 Flash', 'inclusionAI/Ling-3.1-flash', 'BailingMoeV3ForCausalLM', 572.1e9, undefined, 262144, 'mit', '2026-10-13', T, ['reasoning', 'tools', 'multilingual'], 0.25, 1.0, 109, 1276,
    'inclusionAI\'s hybrid linear-attention MoE. Throughput holds up even on very long inputs.', { isNew: true }],
  ['tencent/hy4-preview', 'Hunyuan Hy4 Preview', 'tencent/Hy4-preview', 'HYV4ForCausalLM', 780e9, undefined, 1048576, 'apache-2.0', '2026-08-27', T, ['reasoning', 'long-context', 'multilingual'], 0.5, 2.0, 508, 22997,
    'Preview of Tencent Hunyuan\'s 4th generation. Strong 1M-context understanding in Chinese and English.', { preview: true }],
  ['tencent/hy3', 'Hunyuan Hy3', 'tencent/Hy3', 'HYV3ForCausalLM', 298.8e9, undefined, 262144, 'apache-2.0', '2026-07-02', T, ['reasoning', 'tools', 'multilingual'], 0.2, 0.8, 981, 689929,
    'Tencent Hunyuan 3, general availability. A steady 300B-class MoE.'],
  ['stepfun/step-3.5-flash', 'Step 3.5 Flash', 'stepfun-ai/Step-3.5-Flash', 'Step3p5ForCausalLM', 199.4e9, undefined, 262144, 'apache-2.0', '2026-02-01', T, ['reasoning', 'agent', 'tools'], 0.12, 0.48, 840, 261014,
    'StepFun\'s fast reasoning model. MTP-based speculative decoding makes generation very fast.'],
  ['meta-llama/llama-4-maverick', 'Llama 4 Maverick', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct', 'Llama4ForConditionalGeneration', 401.6e9, 17e9, 1048576, 'llama4', '2025-04-01', TI, ['vision', 'multilingual', 'tools'], 0.15, 0.6, 516, 9439,
    'Meta\'s 128-expert multimodal MoE. Mature ecosystem and broad tooling support.'],
  ['reflection/beam-1.0-501b-a23b', 'Beam 1.0 501B A23B', 'reflection/Beam-1.0-501B-A23B', 'BeamForCausalLM', 501.3e9, 23e9, 1048576, 'apache-2.0', '2026-10-07', T, ['reasoning', 'long-context', 'tools'], 0.35, 1.4, 54, 440,
    'A brand-new architecture released this month. InferStack serves it from day 0 using the reference inference code.', { isNew: true }],
  ['aleph-alpha/kolibri-1', 'Kolibri 1', 'Aleph-Alpha/Kolibri-1', 'Kolibri1ForCausalLM', 78.1e9, undefined, 262144, 'apache-2.0', '2026-10-02', T, ['multilingual', 'tools'], 0.18, 0.7, 941, 17864,
    'Aleph Alpha\'s European multilingual model. Fits workloads with data-sovereignty requirements.', { isNew: true }],
  ['ibm-granite/granite-4.2-30b', 'Granite 4.2 30B', 'ibm-granite/granite-4.2-30b', 'GraniteForCausalLM', 29.3e9, undefined, 131072, 'apache-2.0', '2026-08-07', T, ['tools', 'json', 'coding'], 0.06, 0.2, 133, 36748,
    'IBM\'s enterprise-focused model, tuned for function calling and RAG accuracy.'],
  ['jetbrains/mellum2.1-12b-a2.5b-thinking', 'Mellum 2.1 12B Thinking', 'JetBrains/Mellum2.1-12B-A2.5B-Thinking', 'MellumForCausalLM', 12.1e9, 2.5e9, 131072, 'apache-2.0', '2026-09-20', T, ['coding', 'reasoning'], 0.03, 0.12, 156, 2939,
    'JetBrains\' small code MoE. Ideal for latency-sensitive work like IDE completion and code review.'],
  ['openbmb/minicpm5-2b', 'MiniCPM5 2B', 'openbmb/MiniCPM5-2B', 'LlamaForCausalLM', 2.5e9, undefined, 131072, 'apache-2.0', '2026-09-06', T, ['multilingual'], 0.01, 0.04, 1779, 1282153,
    'An ultra-light 2.5B model. The cheapest option for large batch jobs and classification.', { free: true }],
]

const ORG_NAMES: Record<string, string> = {
  deepseek: 'DeepSeek', qwen: 'Qwen', 'z-ai': 'Z.ai', moonshotai: 'Moonshot AI', minimax: 'MiniMax', xiaomi: 'Xiaomi',
  google: 'Google', mistralai: 'Mistral AI', openai: 'OpenAI', liquid: 'Liquid AI', inclusionai: 'inclusionAI', tencent: 'Tencent',
  stepfun: 'StepFun', 'meta-llama': 'Meta', reflection: 'Reflection', 'aleph-alpha': 'Aleph Alpha', 'ibm-granite': 'IBM', jetbrains: 'JetBrains', openbmb: 'OpenBMB',
}

export const ORG_COLORS: Record<string, string> = {
  deepseek: '#4d6bfe', qwen: '#7c3aed', 'z-ai': '#0ea5e9', moonshotai: '#111827', minimax: '#f43f5e', xiaomi: '#ff6900',
  google: '#34a853', mistralai: '#fa520f', openai: '#10a37f', liquid: '#6366f1', inclusionai: '#14b8a6', tencent: '#0052d9',
  stepfun: '#8b5cf6', 'meta-llama': '#0866ff', reflection: '#64748b', 'aleph-alpha': '#ca8a04', 'ibm-granite': '#0f62fe', jetbrains: '#e11d48', openbmb: '#2563eb',
}

export const MODELS: CatalogModel[] = ROWS.map((r) => {
  const [slug, name, hfId, architecture, params, activeParams, context, license, released, input, capabilities, pin, pout, hfLikes, hfDownloads, description, flags] = r
  const org = slug.split('/')[0]
  return {
    slug, name, hfId, architecture, params, activeParams, context, license, released, input,
    output: ['text'], capabilities, description, hfLikes, hfDownloads,
    org, orgName: ORG_NAMES[org] ?? org,
    price: { input: pin, output: pout, cachedInput: +(pin * 0.25).toFixed(4) },
    ...flags,
  }
})

export const ORGS = Array.from(new Set(MODELS.map((m) => m.org))).map((o) => ({ id: o, name: ORG_NAMES[o] ?? o }))

/** Weekly token volume (demo), derived deterministically from HF popularity and price */
export function weeklyTokens(m: CatalogModel): number {
  const r = rng(m.slug)()
  const pop = Math.log10(m.hfDownloads + 10) * 0.6 + Math.log10(m.hfLikes + 10) * 0.9
  const cheap = 1 / Math.sqrt(m.price.output + 0.05)
  return Math.round(Math.pow(10, pop) * cheap * (0.6 + r) * 2.2e3)
}

export const REGIONS = [
  { region: 'us-east-1', location: 'Virginia', flag: '🇺🇸' },
  { region: 'us-west-2', location: 'Oregon', flag: '🇺🇸' },
  { region: 'eu-central-1', location: 'Frankfurt', flag: '🇩🇪' },
  { region: 'eu-west-2', location: 'London', flag: '🇬🇧' },
  { region: 'ap-northeast-1', location: 'Tokyo', flag: '🇯🇵' },
  { region: 'ap-southeast-1', location: 'Singapore', flag: '🇸🇬' },
  { region: 'ap-south-1', location: 'Mumbai', flag: '🇮🇳' },
  { region: 'sa-east-1', location: 'São Paulo', flag: '🇧🇷' },
]

export function regionName(region: string) {
  return REGIONS.find((r) => r.region === region)?.location ?? region
}

export function regionFlag(region: string) {
  return REGIONS.find((r) => r.region === region)?.flag ?? '🌐'
}

/** Serving endpoints per model (demo) */
export function endpointsFor(m: CatalogModel): Endpoint[] {
  const rand = rng(m.slug + ':ep')
  const big = m.params > 400e9
  const gpus = big ? ['B200', 'H200', 'MI355X'] : m.params > 60e9 ? ['H200', 'H100', 'B200'] : ['H100', 'L40S', 'A100 80GB']
  const quants = big ? ['FP8', 'FP8', 'NVFP4'] : ['BF16', 'FP8', 'FP8']
  const n = 2 + Math.floor(rand() * 3)
  // us-east-1 is the primary region; the rest vary per model
  const regions = [REGIONS[0], ...REGIONS.slice(1).sort(() => rand() - 0.5)].slice(0, n)
  return regions.map((reg, i) => {
    const quant = quants[i % quants.length]
    const fast = quant === 'NVFP4' || quant === 'FP8'
    // For large MoEs without a published active count, assume ~4.5% of total params
    const act = (m.activeParams ?? (m.params > 1e11 ? m.params * 0.045 : m.params)) / 1e9
    const base = 380 / Math.pow(act + 2, 0.55)
    return {
      id: `${reg.region}-${i}`,
      region: reg.region,
      location: reg.location,
      gpu: gpus[i % gpus.length],
      quant,
      priceMul: i === 0 ? 1 : +(1 + rand() * 0.35 - (quant === 'NVFP4' ? 0.15 : 0)).toFixed(2),
      throughput: Math.round(base * (fast ? 1.25 : 1) * (0.75 + rand() * 0.6)),
      latency: Math.round(180 + rand() * 600 + (reg.region.startsWith('us') ? 0 : 90)),
      uptime: +(99 + rand() * 0.98).toFixed(2),
      maxOutput: Math.min(m.context, rand() > 0.5 ? 65536 : 32768),
    }
  })
}

export function findModel(slug: string): CatalogModel | undefined {
  return MODELS.find((m) => m.slug === slug)
}

export const CAPABILITY_LABEL: Record<Capability, string> = {
  reasoning: 'Reasoning', tools: 'Tool calling', vision: 'Vision', coding: 'Coding', agent: 'Agents', 'long-context': 'Long context', multilingual: 'Multilingual', json: 'JSON mode',
}
