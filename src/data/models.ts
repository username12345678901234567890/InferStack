import type { CatalogModel, Capability, Endpoint, Modality } from './types'
import { rng } from '../lib/rand'
import { MISTRAL3_ARCH } from './architectures'

/**
 * 지원 모델 카탈로그.
 * 메타데이터(아키텍처 / 파라미터 / 컨텍스트 / 라이선스 / 공개일)는 2026-10 기준
 * Hugging Face Hub API(config.json, safetensors metadata)에서 가져온 값입니다.
 * 가격은 InferStack 데모용 책정가(USD / 1M tokens)입니다.
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
    'DeepSeek V4 계열의 최신 Flash 업데이트. 1M 컨텍스트와 이미지 입력을 지원하는 대형 MoE 모델로, 비용 대비 성능이 뛰어나 범용 에이전트·코딩 워크로드의 기본값으로 적합합니다.', { isNew: true }],
  ['deepseek/deepseek-v4-pro', 'DeepSeek V4 Pro (0813)', 'deepseek-ai/DeepSeek-V4-Pro-0813', 'DeepseekV4ForCausalLM', 1650.5e9, undefined, 1048576, 'mit', '2026-08-13', T, ['reasoning', 'tools', 'long-context', 'coding', 'agent'], 0.85, 3.4, 897, 157814,
    'DeepSeek V4의 플래그십 Pro 체크포인트(0813). 1.65T 파라미터 MoE로 고난도 추론과 장문 컨텍스트 작업에 최적화되어 있습니다.'],
  ['deepseek/deepseek-v4-flash-vision-exp', 'DeepSeek V4 Flash Vision (Exp)', 'deepseek-ai/DeepSeek-V4-Flash-Vision-Exp', 'DeepseekV4ForCausalLM', 304.6e9, undefined, 1048576, 'mit', '2026-08-31', TI, ['vision', 'tools', 'long-context'], 0.18, 0.7, 952, 480973,
    'DeepSeek V4 Flash 기반 실험적 비전-언어 모델. 문서·차트·스크린샷 이해에 특화되어 있습니다.', { preview: true }],
  ['deepseek/deepseek-v3.2', 'DeepSeek V3.2', 'deepseek-ai/DeepSeek-V3.2', 'DeepseekV32ForCausalLM', 685.4e9, 37e9, 163840, 'mit', '2025-12-01', T, ['reasoning', 'tools', 'coding'], 0.26, 0.4, 1580, 4972497,
    'Sparse Attention(DSA)을 도입한 DeepSeek V3.2. 검증된 안정성과 낮은 가격으로 여전히 가장 많이 쓰이는 모델 중 하나입니다.'],

  ['qwen/qwen3.8-2.4t-a95b', 'Qwen3.8 2.4T A95B', 'Qwen/Qwen3.8-2.4T-A95B', 'Qwen3_5MoeForCausalLM', 2446.2e9, 95e9, 262144, 'qwen', '2026-08-08', T, ['reasoning', 'tools', 'multilingual', 'coding', 'agent'], 1.2, 4.8, 1313, 31991,
    'Qwen 역사상 최대 규모의 2.4T 파라미터 MoE(활성 95B). 최상위 추론·다국어 성능을 제공하는 플래그십 오픈 웨이트 모델입니다.'],
  ['qwen/qwen3.8-flash-next', 'Qwen3.8 Flash Next', 'Qwen/Qwen3.8-Flash-Next', 'Qwen4ExpForConditionalGeneration', 180e9, undefined, 262144, 'qwen', '2026-08-24', TI, ['vision', 'tools', 'multilingual', 'agent'], 0.15, 0.6, 6271, 2379596,
    '차세대(Qwen4 실험) 아키텍처를 적용한 고속 멀티모달 모델. 낮은 지연시간과 높은 처리량이 필요한 프로덕션 트래픽에 적합합니다.', { isNew: true }],
  ['qwen/qwen3.8-27b', 'Qwen3.8 27B', 'Qwen/Qwen3.8-27B', 'Qwen3_5ForConditionalGeneration', 27.8e9, undefined, 262144, 'apache-2.0', '2026-08-05', TI, ['vision', 'tools', 'reasoning', 'multilingual'], 0.08, 0.32, 17830, 7516626,
    'Hugging Face에서 가장 인기 있는 오픈 모델. 27B 덴스 멀티모달 모델로 단일 GPU 배포와 파인튜닝 베이스로 널리 쓰입니다.', { free: true }],
  ['qwen/qwen3-coder-next', 'Qwen3 Coder Next', 'Qwen/Qwen3-Coder-Next', 'Qwen3NextForCausalLM', 79.7e9, 3e9, 262144, 'apache-2.0', '2026-01-30', T, ['coding', 'tools', 'agent', 'long-context'], 0.14, 0.55, 1698, 515484,
    'Qwen3-Next 하이브리드 어텐션 기반 코딩 에이전트 모델. 리포지토리 단위 코드 이해와 툴 호출에 강합니다.'],
  ['qwen/qwen-agentworld-35b-a3b', 'Qwen AgentWorld 35B A3B', 'Qwen/Qwen-AgentWorld-35B-A3B', 'Qwen3_5MoeForConditionalGeneration', 34.7e9, 3e9, 262144, 'apache-2.0', '2026-06-22', T, ['agent', 'tools', 'json'], 0.07, 0.28, 739, 7444,
    '에이전트 환경 학습에 특화된 경량 MoE. 멀티스텝 툴 사용과 구조화 출력이 필요한 워크플로우에 적합합니다.'],

  ['z-ai/glm-5.3', 'GLM-5.3', 'zai-org/GLM-5.3', 'GlmMoeDsaForCausalLM', 753.3e9, undefined, 1048576, 'other', '2026-08-25', T, ['reasoning', 'coding', 'agent', 'tools', 'long-context'], 0.6, 2.2, 2235, 1833879,
    'Z.ai의 최신 GLM-5.3. DSA 기반 1M 컨텍스트 MoE로 에이전틱 코딩 벤치마크에서 최상위권을 기록하는 모델입니다.', { isNew: true }],
  ['z-ai/glm-5.2', 'GLM-5.2', 'zai-org/GLM-5.2', 'GlmMoeDsaForCausalLM', 753.3e9, undefined, 1048576, 'mit', '2026-06-16', T, ['reasoning', 'coding', 'agent', 'tools', 'long-context'], 0.55, 2.0, 5182, 480170,
    'MIT 라이선스의 GLM-5.2. 상업적 사용 제약이 적어 엔터프라이즈 도입이 활발합니다.'],
  ['z-ai/glm-4.7-flash', 'GLM-4.7 Flash', 'zai-org/GLM-4.7-Flash', 'Glm4MoeLiteForCausalLM', 31.2e9, undefined, 202752, 'mit', '2026-01-19', T, ['tools', 'coding', 'multilingual'], 0.06, 0.4, 1879, 1260693,
    'GLM-4.7의 경량 Flash 버전. 빠른 응답과 저렴한 가격으로 분류·요약·RAG에 적합합니다.', { free: true }],

  ['moonshotai/kimi-k3', 'Kimi K3', 'moonshotai/Kimi-K3', 'KimiK3ForConditionalGeneration', 2779.9e9, undefined, 1048576, 'modified-mit', '2026-06-13', TI, ['reasoning', 'agent', 'tools', 'vision', 'long-context', 'coding'], 1.0, 4.0, 11743, 1052786,
    'Moonshot AI의 2.8T 파라미터 멀티모달 에이전트 모델. 긴 호라이즌의 자율 작업과 1M 컨텍스트를 지원합니다.'],
  ['moonshotai/kimi-k2.7-code', 'Kimi K2.7 Code', 'moonshotai/Kimi-K2.7-Code', 'KimiK25ForConditionalGeneration', 1026.9e9, 32e9, 262144, 'modified-mit', '2026-06-11', TI, ['coding', 'agent', 'tools'], 0.6, 2.5, 1419, 113251,
    'Kimi K2.x 라인의 코딩 특화 체크포인트. 스크린샷 기반 프론트엔드 생성과 SWE 에이전트 작업에 강합니다.'],
  ['moonshotai/kimi-k2.6', 'Kimi K2.6', 'moonshotai/Kimi-K2.6', 'KimiK25ForConditionalGeneration', 1026.9e9, 32e9, 262144, 'modified-mit', '2026-04-14', TI, ['agent', 'tools', 'vision', 'reasoning'], 0.55, 2.3, 1630, 389201,
    '1T 파라미터 MoE 멀티모달 모델. 에이전트 스웜과 툴 호출 안정성이 뛰어납니다.'],

  ['minimax/minimax-m2.7', 'MiniMax M2.7', 'MiniMaxAI/MiniMax-M2.7', 'MiniMaxM2ForCausalLM', 228.7e9, 10e9, 204800, 'other', '2026-04-09', T, ['coding', 'agent', 'tools'], 0.3, 1.2, 1256, 615924,
    '활성 파라미터가 작아 빠르고 저렴한 에이전틱 코딩 모델. 인터리브드 thinking을 지원합니다.'],

  ['xiaomi/mimo-v2.6-pro', 'MiMo V2.6 Pro', 'XiaomiMiMo/MiMo-V2.6-Pro-RL', 'MiMoV2ForCausalLM', 1024.2e9, undefined, 1048576, 'mit', '2026-09-21', T, ['reasoning', 'coding', 'tools', 'long-context'], 0.7, 2.8, 736, 100156,
    'Xiaomi MiMo V2.6 Pro RL 체크포인트. 강화학습으로 수학·코딩 추론을 강화한 1T급 모델입니다.', { isNew: true }],
  ['xiaomi/mimo-v2.6-flash', 'MiMo V2.6 Flash', 'XiaomiMiMo/MiMo-V2.6-Flash-RL', 'MiMoV2ForCausalLM', 310.8e9, undefined, 1048576, 'mit', '2026-09-21', T, ['reasoning', 'coding', 'tools'], 0.12, 0.5, 561, 92057,
    'MiMo V2.6의 고속 Flash 버전. 추론 품질 대비 매우 높은 처리량을 제공합니다.', { isNew: true }],

  ['google/gemma-4-31b-it', 'Gemma 4 31B', 'google/gemma-4-31B-it', 'Gemma4ForConditionalGeneration', 31.3e9, undefined, 262144, 'apache-2.0', '2026-03-11', TI, ['vision', 'multilingual', 'tools'], 0.1, 0.3, 4134, 9088689,
    'Google Gemma 4 최대 덴스 모델. Apache-2.0 라이선스로 공개되어 온프레미스와 파인튜닝에 폭넓게 쓰입니다.'],
  ['google/gemma-4-26b-a4b-it', 'Gemma 4 26B A4B', 'google/gemma-4-26B-A4B-it', 'Gemma4ForConditionalGeneration', 25.8e9, 4e9, 262144, 'apache-2.0', '2026-03-11', TI, ['vision', 'multilingual', 'tools'], 0.07, 0.25, 1659, 10951317,
    'Gemma 4 MoE 버전. 활성 4B로 매우 빠르며 다운로드 수 1위권의 실사용 모델입니다.'],
  ['google/gemma-4-12b-it', 'Gemma 4 12B', 'google/gemma-4-12B-it', 'Gemma4UnifiedForConditionalGeneration', 12e9, undefined, 262144, 'apache-2.0', '2026-05-23', TIA, ['vision', 'multilingual'], 0.04, 0.12, 1666, 1656973,
    '텍스트·이미지·오디오 입력을 하나의 모델로 처리하는 Gemma 4 Unified 12B.', { free: true }],

  ['mistralai/mistral-medium-3.5', 'Mistral Medium 3.5', 'mistralai/Mistral-Medium-3.5-128B', MISTRAL3_ARCH, 127.7e9, undefined, 262144, 'mistral-research', '2026-03-31', TI, ['tools', 'vision', 'multilingual', 'coding'], 0.4, 1.6, 485, 74114,
    '128B 덴스 멀티모달 모델. 유럽 언어와 엔터프라이즈 문서 처리에 강합니다.'],
  ['mistralai/mistral-small-4', 'Mistral Small 4 (2603)', 'mistralai/Mistral-Small-4-119B-2603', MISTRAL3_ARCH, 119.4e9, undefined, 1048576, 'apache-2.0', '2026-01-23', TI, ['tools', 'vision', 'long-context', 'json'], 0.2, 0.6, 452, 73570,
    'Apache-2.0 Mistral Small 4. 1M 컨텍스트와 함수 호출을 지원하는 범용 모델입니다.'],

  ['openai/gpt-oss-120b', 'gpt-oss-120b', 'openai/gpt-oss-120b', 'GptOssForCausalLM', 116.8e9, 5.1e9, 131072, 'apache-2.0', '2025-08-04', T, ['reasoning', 'tools', 'json'], 0.05, 0.25, 5411, 3362048,
    'OpenAI의 오픈 웨이트 추론 모델. MXFP4 네이티브로 단일 H100에서 구동 가능하며 reasoning effort 조절을 지원합니다.'],
  ['openai/gpt-oss-20b', 'gpt-oss-20b', 'openai/gpt-oss-20b', 'GptOssForCausalLM', 20.9e9, 3.6e9, 131072, 'apache-2.0', '2025-08-04', T, ['reasoning', 'tools'], 0.03, 0.14, 5186, 5956790,
    'gpt-oss의 경량 버전. 엣지·로컬 수준 자원으로도 동작하는 저지연 추론 모델입니다.', { free: true }],

  ['liquid/lfm2.5-24b-a2b', 'LFM2.5 24B A2B', 'LiquidAI/LFM2.5-24B-A2B', 'Lfm2MoeForCausalLM', 24e9, 2e9, 131072, 'lfm-open', '2026-10-12', T, ['tools', 'multilingual'], 0.03, 0.12, 412, 9356,
    'Liquid AI의 하이브리드(컨볼루션+어텐션) MoE. 활성 2B로 초저지연을 제공하는 이번 주 HF 트렌딩 1위 모델입니다.', { isNew: true }],
  ['inclusionai/ling-3.1-flash', 'Ling 3.1 Flash', 'inclusionAI/Ling-3.1-flash', 'BailingMoeV3ForCausalLM', 572.1e9, undefined, 262144, 'mit', '2026-10-13', T, ['reasoning', 'tools', 'multilingual'], 0.25, 1.0, 109, 1276,
    'inclusionAI의 하이브리드 리니어 어텐션 MoE. 긴 입력에서도 처리량이 떨어지지 않는 것이 특징입니다.', { isNew: true }],
  ['tencent/hy4-preview', 'Hunyuan Hy4 Preview', 'tencent/Hy4-preview', 'HYV4ForCausalLM', 780e9, undefined, 1048576, 'apache-2.0', '2026-08-27', T, ['reasoning', 'long-context', 'multilingual'], 0.5, 2.0, 508, 22997,
    'Tencent Hunyuan 4세대 프리뷰. 1M 컨텍스트 장문 이해와 중국어·영어 이중언어 성능이 강점입니다.', { preview: true }],
  ['tencent/hy3', 'Hunyuan Hy3', 'tencent/Hy3', 'HYV3ForCausalLM', 298.8e9, undefined, 262144, 'apache-2.0', '2026-07-02', T, ['reasoning', 'tools', 'multilingual'], 0.2, 0.8, 981, 689929,
    'Tencent Hunyuan 3세대 정식 버전. 안정적인 범용 성능의 300B급 MoE입니다.'],
  ['stepfun/step-3.5-flash', 'Step 3.5 Flash', 'stepfun-ai/Step-3.5-Flash', 'Step3p5ForCausalLM', 199.4e9, undefined, 262144, 'apache-2.0', '2026-02-01', T, ['reasoning', 'agent', 'tools'], 0.12, 0.48, 840, 261014,
    'StepFun의 고속 추론 모델. MTP 기반 투기적 디코딩으로 매우 빠른 생성 속도를 보여줍니다.'],
  ['meta-llama/llama-4-maverick', 'Llama 4 Maverick', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct', 'Llama4ForConditionalGeneration', 401.6e9, 17e9, 1048576, 'llama4', '2025-04-01', TI, ['vision', 'multilingual', 'tools'], 0.15, 0.6, 516, 9439,
    'Meta의 128 전문가 MoE 멀티모달 모델. 검증된 생태계와 폭넓은 툴링 지원이 장점입니다.'],
  ['reflection/beam-1.0-501b-a23b', 'Beam 1.0 501B A23B', 'reflection/Beam-1.0-501B-A23B', 'BeamForCausalLM', 501.3e9, 23e9, 1048576, 'apache-2.0', '2026-10-07', T, ['reasoning', 'long-context', 'tools'], 0.35, 1.4, 54, 440,
    '이번 달 공개된 신규 아키텍처 MoE. InferStack은 레퍼런스 추론 코드를 기반으로 Day-0 지원을 제공합니다.', { isNew: true }],
  ['aleph-alpha/kolibri-1', 'Kolibri 1', 'Aleph-Alpha/Kolibri-1', 'Kolibri1ForCausalLM', 78.1e9, undefined, 262144, 'apache-2.0', '2026-10-02', T, ['multilingual', 'tools'], 0.18, 0.7, 941, 17864,
    'Aleph Alpha의 유럽 다국어 특화 모델. 데이터 주권 요구가 있는 워크로드에 적합합니다.', { isNew: true }],
  ['ibm-granite/granite-4.2-30b', 'Granite 4.2 30B', 'ibm-granite/granite-4.2-30b', 'GraniteForCausalLM', 29.3e9, undefined, 131072, 'apache-2.0', '2026-08-07', T, ['tools', 'json', 'coding'], 0.06, 0.2, 133, 36748,
    'IBM의 엔터프라이즈 지향 모델. 함수 호출과 RAG 정확도에 초점을 맞췄습니다.'],
  ['jetbrains/mellum2.1-12b-a2.5b-thinking', 'Mellum 2.1 12B Thinking', 'JetBrains/Mellum2.1-12B-A2.5B-Thinking', 'MellumForCausalLM', 12.1e9, 2.5e9, 131072, 'apache-2.0', '2026-09-20', T, ['coding', 'reasoning'], 0.03, 0.12, 156, 2939,
    'JetBrains의 코드 특화 소형 MoE. IDE 자동완성·코드 리뷰처럼 지연에 민감한 작업에 최적입니다.'],
  ['openbmb/minicpm5-2b', 'MiniCPM5 2B', 'openbmb/MiniCPM5-2B', 'LlamaForCausalLM', 2.5e9, undefined, 131072, 'apache-2.0', '2026-09-06', T, ['multilingual'], 0.01, 0.04, 1779, 1282153,
    '2.5B 초경량 모델. 대량 배치 처리와 분류 작업에 최저 비용으로 사용할 수 있습니다.', { free: true }],
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

/** 주간 토큰 사용량(데모) — HF 인기도 + 가격대 기반으로 결정론적으로 생성 */
export function weeklyTokens(m: CatalogModel): number {
  const r = rng(m.slug)()
  const pop = Math.log10(m.hfDownloads + 10) * 0.6 + Math.log10(m.hfLikes + 10) * 0.9
  const cheap = 1 / Math.sqrt(m.price.output + 0.05)
  return Math.round(Math.pow(10, pop) * cheap * (0.6 + r) * 2.2e3)
}

const REGIONS = [
  { region: 'ap-seoul-1', location: '서울', flag: '🇰🇷' },
  { region: 'ap-tokyo-1', location: '도쿄', flag: '🇯🇵' },
  { region: 'us-east-1', location: '버지니아', flag: '🇺🇸' },
  { region: 'us-west-2', location: '오리건', flag: '🇺🇸' },
  { region: 'eu-central-1', location: '프랑크푸르트', flag: '🇩🇪' },
]

export function regionFlag(region: string) {
  return REGIONS.find((r) => r.region === region)?.flag ?? '🌐'
}

/** 모델별 서빙 엔드포인트(데모) */
export function endpointsFor(m: CatalogModel): Endpoint[] {
  const rand = rng(m.slug + ':ep')
  const big = m.params > 400e9
  const gpus = big ? ['B200', 'H200', 'MI355X'] : m.params > 60e9 ? ['H200', 'H100', 'B200'] : ['H100', 'L40S', 'A100 80GB']
  const quants = big ? ['FP8', 'FP8', 'NVFP4'] : ['BF16', 'FP8', 'FP8']
  const n = 2 + Math.floor(rand() * 3)
  // 서울이 기본 리전, 나머지는 모델마다 다르게
  const regions = [REGIONS[0], ...REGIONS.slice(1).sort(() => rand() - 0.5)].slice(0, n)
  return regions.map((reg, i) => {
    const quant = quants[i % quants.length]
    const fast = quant === 'NVFP4' || quant === 'FP8'
    // 활성 파라미터가 공개되지 않은 대형 MoE는 총 파라미터의 약 4.5%로 가정
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
      latency: Math.round(180 + rand() * 600 + (reg.region.startsWith('ap') ? 0 : 90)),
      uptime: +(99 + rand() * 0.98).toFixed(2),
      maxOutput: Math.min(m.context, rand() > 0.5 ? 65536 : 32768),
    }
  })
}

export function findModel(slug: string): CatalogModel | undefined {
  return MODELS.find((m) => m.slug === slug)
}

export const CAPABILITY_LABEL: Record<Capability, string> = {
  reasoning: '추론', tools: '툴 호출', vision: '비전', coding: '코딩', agent: '에이전트', 'long-context': '롱 컨텍스트', multilingual: '다국어', json: 'JSON 모드',
}
