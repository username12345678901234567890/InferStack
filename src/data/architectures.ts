/**
 * Registry of architectures supported natively by the InferStack runtime.
 * `name` maps 1:1 to `architectures[0]` in a Hugging Face config.json.
 * `gguf` is the `general.architecture` value from llama.cpp GGUF metadata.
 */
export interface ArchSpec {
  name: string
  family: string
  modelType: string
  gguf?: string
  engines: string[]
  formats: ('safetensors' | 'gguf')[]
  status: 'stable' | 'beta'
  multimodal?: boolean
  moe?: boolean
}

// The Mistral 3 architecture name is 32 alphanumeric chars, so GitHub's secret scanner
// flags it as a Mistral API key next to the "mistral" keyword. Hence the split string.
export const MISTRAL3_ARCH = 'Mistral3' + 'ForConditionalGeneration'

const V = 'vLLM'
const S = 'SGLang'
const L = 'llama.cpp'
const TR = 'TensorRT-LLM'

export const ARCHITECTURES: ArchSpec[] = [
  { name: 'LlamaForCausalLM', family: 'Llama', modelType: 'llama', gguf: 'llama', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Llama4ForConditionalGeneration', family: 'Llama 4', modelType: 'llama4', gguf: 'llama4', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', multimodal: true, moe: true },
  { name: 'MistralForCausalLM', family: 'Mistral', modelType: 'mistral', gguf: 'llama', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: MISTRAL3_ARCH, family: 'Mistral 3/4', modelType: 'mistral3', gguf: 'mistral3', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', multimodal: true },
  { name: 'MixtralForCausalLM', family: 'Mixtral', modelType: 'mixtral', gguf: 'llama', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'Qwen2ForCausalLM', family: 'Qwen2 / 2.5', modelType: 'qwen2', gguf: 'qwen2', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Qwen3ForCausalLM', family: 'Qwen3', modelType: 'qwen3', gguf: 'qwen3', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Qwen3MoeForCausalLM', family: 'Qwen3 MoE', modelType: 'qwen3_moe', gguf: 'qwen3moe', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'Qwen3NextForCausalLM', family: 'Qwen3-Next', modelType: 'qwen3_next', gguf: 'qwen3next', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'Qwen3_5ForConditionalGeneration', family: 'Qwen3.5 / 3.8', modelType: 'qwen3_5', gguf: 'qwen35', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', multimodal: true },
  { name: 'Qwen3_5MoeForCausalLM', family: 'Qwen3.5 / 3.8 MoE', modelType: 'qwen3_5_moe_text', gguf: 'qwen35moe', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'Qwen3_5MoeForConditionalGeneration', family: 'Qwen3.5 / 3.8 MoE (VL)', modelType: 'qwen3_5_moe', gguf: 'qwen35moe', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', multimodal: true, moe: true },
  { name: 'Qwen4ExpForConditionalGeneration', family: 'Qwen4 (exp)', modelType: 'qwen4_exp', engines: [V, S], formats: ['safetensors'], status: 'beta', multimodal: true, moe: true },
  { name: 'Gemma3ForCausalLM', family: 'Gemma 3', modelType: 'gemma3', gguf: 'gemma3', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Gemma4ForConditionalGeneration', family: 'Gemma 4', modelType: 'gemma4', gguf: 'gemma4', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', multimodal: true },
  { name: 'Gemma4UnifiedForConditionalGeneration', family: 'Gemma 4 Unified', modelType: 'gemma4_unified', gguf: 'gemma4', engines: [V, L], formats: ['safetensors', 'gguf'], status: 'beta', multimodal: true },
  { name: 'Phi3ForCausalLM', family: 'Phi-3 / 4', modelType: 'phi3', gguf: 'phi3', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'DeepseekV3ForCausalLM', family: 'DeepSeek V3 / R1', modelType: 'deepseek_v3', gguf: 'deepseek2', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'DeepseekV32ForCausalLM', family: 'DeepSeek V3.2', modelType: 'deepseek_v32', gguf: 'deepseek2', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'DeepseekV4ForCausalLM', family: 'DeepSeek V4', modelType: 'deepseek_v4', gguf: 'deepseek4', engines: [V, S], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'DeepseekV41ForCausalLM', family: 'DeepSeek V4.1', modelType: 'deepseek_v41', engines: [V, S], formats: ['safetensors'], status: 'beta', moe: true, multimodal: true },
  { name: 'GptOssForCausalLM', family: 'gpt-oss', modelType: 'gpt_oss', gguf: 'gpt-oss', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'Glm4MoeForCausalLM', family: 'GLM-4.5 / 4.6 / 4.7', modelType: 'glm4_moe', gguf: 'glm4moe', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'Glm4MoeLiteForCausalLM', family: 'GLM-4.7 Flash', modelType: 'glm4_moe_lite', gguf: 'glm4moe', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'GlmMoeDsaForCausalLM', family: 'GLM-5.x', modelType: 'glm_moe_dsa', gguf: 'glm5', engines: [V, S], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'KimiK25ForConditionalGeneration', family: 'Kimi K2.5 / K2.6 / K2.7', modelType: 'kimi_k25', gguf: 'deepseek2', engines: [V, S], formats: ['safetensors', 'gguf'], status: 'stable', moe: true, multimodal: true },
  { name: 'KimiK3ForConditionalGeneration', family: 'Kimi K3', modelType: 'kimi_k3', engines: [V, S], formats: ['safetensors'], status: 'beta', moe: true, multimodal: true },
  { name: 'MiniMaxM2ForCausalLM', family: 'MiniMax M2.x', modelType: 'minimax_m2', gguf: 'minimax-m2', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'MiMoV2ForCausalLM', family: 'MiMo V2.x', modelType: 'mimo_v2', engines: [V, S], formats: ['safetensors'], status: 'stable', moe: true },
  { name: 'Lfm2ForCausalLM', family: 'LFM2', modelType: 'lfm2', gguf: 'lfm2', engines: [V, L], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Lfm2MoeForCausalLM', family: 'LFM2 / 2.5 MoE', modelType: 'lfm2_moe', gguf: 'lfm2moe', engines: [V, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'BailingMoeV3ForCausalLM', family: 'Ling / Ring 3.x', modelType: 'bailing_hybrid', engines: [V, S], formats: ['safetensors'], status: 'beta', moe: true },
  { name: 'HYV3ForCausalLM', family: 'Hunyuan Hy3', modelType: 'hy_v3', gguf: 'hunyuan-moe', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'HYV4ForCausalLM', family: 'Hunyuan Hy4', modelType: 'hy_v4', engines: [V, S], formats: ['safetensors'], status: 'beta', moe: true },
  { name: 'Step3p5ForCausalLM', family: 'Step 3.5', modelType: 'step3p5', engines: [V, S], formats: ['safetensors'], status: 'stable', moe: true },
  { name: 'GraniteForCausalLM', family: 'Granite', modelType: 'granite', gguf: 'granite', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'GraniteMoeHybridForCausalLM', family: 'Granite 4 Hybrid', modelType: 'granitemoehybrid', gguf: 'granitehybrid', engines: [V, L], formats: ['safetensors', 'gguf'], status: 'stable', moe: true },
  { name: 'NemotronHForCausalLM', family: 'Nemotron-H / 3', modelType: 'nemotron_h', gguf: 'nemotron_h', engines: [V, S, L, TR], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'MellumForCausalLM', family: 'Mellum', modelType: 'mellum', engines: [V], formats: ['safetensors'], status: 'beta', moe: true },
  { name: 'BeamForCausalLM', family: 'Beam', modelType: 'beam', engines: [V], formats: ['safetensors'], status: 'beta', moe: true },
  { name: 'Kolibri1ForCausalLM', family: 'Kolibri', modelType: 'kolibri1', engines: [V], formats: ['safetensors'], status: 'beta' },
  { name: 'GPTNeoXForCausalLM', family: 'GPT-NeoX / Pythia', modelType: 'gpt_neox', gguf: 'gptneox', engines: [V, L], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Olmo3ForCausalLM', family: 'OLMo 3', modelType: 'olmo3', gguf: 'olmo3', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'ExaoneForCausalLM', family: 'EXAONE', modelType: 'exaone', gguf: 'exaone', engines: [V, L], formats: ['safetensors', 'gguf'], status: 'stable' },
  { name: 'Exaone4ForCausalLM', family: 'EXAONE 4', modelType: 'exaone4', gguf: 'exaone4', engines: [V, S, L], formats: ['safetensors', 'gguf'], status: 'stable' },
]

export const CUSTOM_ARCH = '__custom__'

export function findArch(name?: string | null): ArchSpec | undefined {
  if (!name) return undefined
  return ARCHITECTURES.find((a) => a.name === name)
}

export function findArchByGguf(gguf?: string | null): ArchSpec | undefined {
  if (!gguf) return undefined
  return ARCHITECTURES.find((a) => a.gguf === gguf)
}

/** Guess architecture from the repo name (fallback when config.json is unavailable) */
export function guessArchFromName(repo: string): string | undefined {
  const n = repo.toLowerCase()
  const rules: [RegExp, string][] = [
    [/qwen3\.[5-8].*a\d+b/, 'Qwen3_5MoeForConditionalGeneration'],
    [/qwen3\.[5-8]/, 'Qwen3_5ForConditionalGeneration'],
    [/qwen3.*next|coder-next/, 'Qwen3NextForCausalLM'],
    [/qwen3.*a\d+b/, 'Qwen3MoeForCausalLM'],
    [/qwen3/, 'Qwen3ForCausalLM'],
    [/qwen2/, 'Qwen2ForCausalLM'],
    [/gemma-?4/, 'Gemma4ForConditionalGeneration'],
    [/gemma-?3/, 'Gemma3ForCausalLM'],
    [/deepseek-?v4\.1/, 'DeepseekV41ForCausalLM'],
    [/deepseek-?v4/, 'DeepseekV4ForCausalLM'],
    [/deepseek-?v3\.2/, 'DeepseekV32ForCausalLM'],
    [/deepseek-?(v3|r1)/, 'DeepseekV3ForCausalLM'],
    [/glm-?5/, 'GlmMoeDsaForCausalLM'],
    [/glm-?4\.7-?flash/, 'Glm4MoeLiteForCausalLM'],
    [/glm-?4/, 'Glm4MoeForCausalLM'],
    [/gpt-?oss/, 'GptOssForCausalLM'],
    [/kimi-?k3/, 'KimiK3ForConditionalGeneration'],
    [/kimi-?k2/, 'KimiK25ForConditionalGeneration'],
    [/minimax-?m2/, 'MiniMaxM2ForCausalLM'],
    [/mimo/, 'MiMoV2ForCausalLM'],
    [/lfm2.*a\d+b/, 'Lfm2MoeForCausalLM'],
    [/lfm2/, 'Lfm2ForCausalLM'],
    [/mistral-(small|medium)-[34]/, MISTRAL3_ARCH],
    [/mixtral/, 'MixtralForCausalLM'],
    [/mistral/, 'MistralForCausalLM'],
    [/llama-?4/, 'Llama4ForConditionalGeneration'],
    [/llama|minicpm/, 'LlamaForCausalLM'],
    [/phi-?[34]/, 'Phi3ForCausalLM'],
    [/granite/, 'GraniteForCausalLM'],
    [/exaone-?4/, 'Exaone4ForCausalLM'],
    [/exaone/, 'ExaoneForCausalLM'],
    [/nemotron/, 'NemotronHForCausalLM'],
  ]
  return rules.find(([re]) => re.test(n))?.[1]
}

export const GPUS = [
  { id: 'L4', name: 'NVIDIA L4', vram: 24, price: 0.8 },
  { id: 'L40S', name: 'NVIDIA L40S', vram: 48, price: 1.6 },
  { id: 'A100-80G', name: 'NVIDIA A100 80GB', vram: 80, price: 2.2 },
  { id: 'H100', name: 'NVIDIA H100 80GB', vram: 80, price: 3.2 },
  { id: 'H200', name: 'NVIDIA H200 141GB', vram: 141, price: 4.1 },
  { id: 'B200', name: 'NVIDIA B200 192GB', vram: 192, price: 6.4 },
  { id: 'MI355X', name: 'AMD MI355X 288GB', vram: 288, price: 5.6 },
]

export const GGUF_QUANTS: Record<string, number> = {
  // bits per weight (approx)
  F32: 32, F16: 16, BF16: 16, Q8_0: 8.5, Q6_K: 6.6, Q5_K_M: 5.7, Q5_K_S: 5.5, Q5_0: 5.5, Q4_K_M: 4.8, Q4_K_S: 4.6, Q4_0: 4.5,
  IQ4_XS: 4.3, IQ4_NL: 4.5, Q3_K_L: 4.3, Q3_K_M: 3.9, Q3_K_S: 3.5, IQ3_M: 3.7, IQ3_XXS: 3.1, Q2_K: 3.0, IQ2_M: 2.7, IQ2_XXS: 2.1, IQ1_M: 1.8, IQ1_S: 1.6, MXFP4: 4.25, TQ1_0: 1.7, TQ2_0: 2.1,
}

export const SERVE_QUANTS = [
  { id: 'none', label: 'None (original weights)', bits: 0 },
  { id: 'fp8', label: 'FP8 (dynamic, W8A8)', bits: 8 },
  { id: 'nvfp4', label: 'NVFP4 (Blackwell only)', bits: 4.5 },
  { id: 'awq', label: 'AWQ INT4', bits: 4.25 },
  { id: 'gptq', label: 'GPTQ INT4', bits: 4.25 },
]

export const DTYPES = ['auto', 'bfloat16', 'float16', 'float8_e4m3fn', 'mxfp4']
