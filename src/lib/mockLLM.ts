/** 데모용 가짜 LLM 응답 생성기 (실제 백엔드 없음) */
import { rng } from './rand'

const SNIPPETS: { re: RegExp; reply: (model: string) => string }[] = [
  {
    re: /(코드|code|python|파이썬|함수|function|javascript|typescript)/i,
    reply: (m) => `물론입니다. 아래는 InferStack API를 OpenAI 호환 SDK로 호출하는 예시입니다.

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.inferstack.dev/v1",
    api_key="sk-is-v1-...",
)

resp = client.chat.completions.create(
    model="${m}",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True,
)
for chunk in resp:
    print(chunk.choices[0].delta.content or "", end="")
\`\`\`

핵심 포인트:
1. \`base_url\`만 바꾸면 기존 OpenAI 코드가 그대로 동작합니다.
2. \`model\`에 카탈로그의 슬러그(예: \`${m}\`)를 넣으세요.
3. \`stream=True\`로 토큰 단위 스트리밍을 받을 수 있습니다.`,
  },
  {
    re: /(안녕|hello|hi\b|반가)/i,
    reply: (m) => `안녕하세요! 저는 InferStack에서 서빙 중인 **${m}** 입니다. 😊

무엇을 도와드릴까요? 예를 들어 이런 걸 할 수 있어요:
- 문서 요약·번역
- 코드 작성 및 리뷰
- 데이터 분석 아이디어 정리
- 복잡한 문제의 단계별 추론`,
  },
  {
    re: /(gguf|safetensors|양자화|quant)/i,
    reply: () => `**GGUF vs Safetensors** 간단 비교입니다.

| 항목 | GGUF | Safetensors |
|---|---|---|
| 주 런타임 | llama.cpp | vLLM / SGLang / TensorRT-LLM |
| 양자화 | 파일 자체에 포함 (Q4_K_M 등) | 서빙 시 FP8/AWQ/GPTQ 선택 |
| 장점 | 단일 파일, 작은 VRAM | 높은 처리량, 배치 효율 |
| 추천 | 소형~중형, 비용 최적화 | 대형 모델, 프로덕션 트래픽 |

InferStack에서는 두 포맷 모두 업로드할 수 있으며 포맷에 맞춰 엔진이 자동 선택됩니다.`,
  },
  {
    re: /(가격|price|비용|cost)/i,
    reply: (m) => `InferStack은 **토큰 단위 종량제**입니다. \`${m}\`의 경우 입력/출력 토큰 가격이 모델 페이지에 표시되며, 캐시된 입력 토큰은 75% 할인됩니다. 크레딧은 선불로 충전하고 사용량만큼 차감됩니다.`,
  },
]

const GENERIC = [
  (m: string, q: string) => `좋은 질문입니다. "${q.slice(0, 60)}${q.length > 60 ? '…' : ''}"에 대해 단계별로 정리해 보겠습니다.

**1. 문제 정의**
먼저 무엇을 해결하려는지 명확히 해야 합니다. 목표, 제약 조건, 성공 기준을 구분하면 접근 방향이 선명해집니다.

**2. 핵심 고려사항**
- 데이터와 맥락: 어떤 정보가 이미 주어졌고, 무엇이 부족한가
- 트레이드오프: 속도·비용·정확도 사이의 균형
- 검증 방법: 결과가 맞는지 어떻게 확인할 것인가

**3. 제안**
작게 시작해서 빠르게 검증하고, 결과를 보며 반복적으로 개선하는 방식을 추천합니다.

_(이 응답은 InferStack 데모 환경에서 ${m} 모델을 시뮬레이션한 결과입니다.)_`,
]

export function mockReply(model: string, prompt: string): string {
  const hit = SNIPPETS.find((s) => s.re.test(prompt))
  if (hit) return hit.reply(model)
  const r = rng(prompt + model)
  return GENERIC[Math.floor(r() * GENERIC.length)](model, prompt)
}

export function estimateTokens(text: string): number {
  // 대략: 영문 4자/토큰, 한글 1.5자/토큰
  const ko = (text.match(/[가-힣]/g) ?? []).length
  return Math.max(1, Math.round(ko / 1.5 + (text.length - ko) / 4))
}

/** 텍스트를 토큰 단위 조각으로 쪼개 스트리밍 흉내 */
export function* chunkText(text: string): Generator<string> {
  const parts = text.match(/(\s+|[가-힣]{1,2}|[^\s가-힣]{1,4})/g) ?? [text]
  for (const p of parts) yield p
}
