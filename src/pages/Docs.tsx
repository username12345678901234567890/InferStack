import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Badge, Card, CodeBlock } from '../components/ui'
import { REQUIREMENTS_TEMPLATE, SPEC_TREE, manifestTemplate, modelPyTemplate } from '../data/customArchSpec'

const TOC = [
  ['quickstart', '빠른 시작'],
  ['auth', '인증'],
  ['api', 'Chat Completions'],
  ['models-api', '모델 목록'],
  ['routing', '라우팅 & 폴백'],
  ['errors', '에러 코드'],
  ['custom', '커스텀 모델 API'],
  ['cli', 'CLI 레퍼런스'],
  ['arch', '아키텍처 패키지 규격'],
  ['billing', '과금'],
] as const

export default function Docs() {
  const loc = useLocation()
  useEffect(() => {
    if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [loc.hash])

  return (
    <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-20 space-y-1 text-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg3">문서</div>
          {TOC.map(([id, l]) => (
            <a
              key={id}
              href={`#/docs#${id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="block rounded-md px-2 py-1 text-fg2 hover:bg-raised hover:text-fg"
            >
              {l}
            </a>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 max-w-3xl space-y-14 [&_p_code]:rounded [&_p_code]:bg-raised [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:text-[0.86em] [&_li_code]:rounded [&_li_code]:bg-raised [&_li_code]:px-1.5 [&_li_code]:text-[0.86em] [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-fg2">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">InferStack 문서</h1>
          <p className="mt-3">InferStack은 최신 오픈소스 LLM을 OpenAI 호환 API로 제공하고, 직접 업로드한 모델을 서버리스 엔드포인트로 배포하는 추론 플랫폼입니다.</p>
        </section>

        <section>
          <h2 id="quickstart">빠른 시작</h2>
          <p className="mt-3">
            1) <Link to="/keys" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">API 키 발급</Link> → 2) <Link to="/credits" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">크레딧 충전</Link> → 3) OpenAI SDK의 <code>base_url</code>을 변경합니다.
          </p>
          <CodeBlock
            className="mt-4"
            lang="python"
            code={`pip install openai

from openai import OpenAI
client = OpenAI(base_url="https://api.inferstack.dev/v1", api_key="sk-is-v1-...")

r = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Hello"}],
)
print(r.choices[0].message.content)`}
          />
        </section>

        <section>
          <h2 id="auth">인증</h2>
          <p className="mt-3">
            모든 요청은 <code>Authorization: Bearer sk-is-v1-…</code> 헤더가 필요합니다. 선택적으로 <code>X-Title</code>, <code>HTTP-Referer</code> 헤더를 보내면 랭킹 페이지의 앱 목록에 표시됩니다.
          </p>
        </section>

        <section>
          <h2 id="api">Chat Completions</h2>
          <p className="mt-3">
            <Badge color="green">POST</Badge> <code className="font-mono">/v1/chat/completions</code> — OpenAI Chat Completions와 동일한 스키마입니다.
          </p>
          <Card className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-fg3">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 font-medium">파라미터</th>
                  <th className="px-3 py-2 font-medium">타입</th>
                  <th className="px-3 py-2 font-medium">설명</th>
                </tr>
              </thead>
              <tbody className="[&_td]:px-3 [&_td]:py-2 [&_td:first-child]:px-4 [&_tr]:border-b [&_tr]:border-line">
                {[
                  ['model', 'string', '모델 슬러그. 예: z-ai/glm-5.3, demo/my-model'],
                  ['messages', 'array', 'role/content 메시지 배열. content는 텍스트 또는 image_url 파트 배열'],
                  ['stream', 'boolean', 'SSE 스트리밍 여부'],
                  ['temperature / top_p / top_k', 'number', '샘플링 파라미터'],
                  ['max_tokens', 'integer', '최대 생성 토큰'],
                  ['tools / tool_choice', 'array / string', '함수 호출'],
                  ['response_format', 'object', '{"type":"json_object"} 또는 json_schema'],
                  ['reasoning', 'object', '{"effort":"low|medium|high"} — 추론 모델 전용'],
                  ['provider', 'object', '라우팅 선호도 (아래 참고)'],
                  ['models', 'string[]', '폴백 모델 목록 — 첫 모델 실패 시 순서대로 시도'],
                ].map(([a, b, c]) => (
                  <tr key={a}>
                    <td className="font-mono text-xs">{a}</td>
                    <td className="text-xs text-fg3">{b}</td>
                    <td>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <h3>응답 usage</h3>
          <CodeBlock
            className="mt-3"
            lang="json"
            code={`"usage": {
"prompt_tokens": 1204,
"completion_tokens": 311,
"prompt_tokens_details": { "cached_tokens": 1024 },
"cost": 0.000614,
"provider": "ap-seoul-1"
}`}
          />
        </section>

        <section>
          <h2 id="models-api">모델 목록</h2>
          <p className="mt-3">
            <Badge color="brand">GET</Badge> <code className="font-mono">/v1/models</code> — 카탈로그 모델과 내가 배포한 커스텀 모델을 함께 반환합니다. 각 항목에 <code>pricing</code>, <code>context_length</code>, <code>architecture</code>, <code>hugging_face_id</code> 가 포함됩니다.
          </p>
        </section>

        <section>
          <h2 id="routing">라우팅 & 폴백</h2>
          <p className="mt-3">각 모델은 여러 리전·GPU·양자화 엔드포인트로 서빙됩니다. 기본값은 가격·지연·가동률을 종합한 자동 라우팅입니다.</p>
          <CodeBlock
            className="mt-4"
            lang="json"
            code={`{
"model": "qwen/qwen3.8-27b",
"messages": [...],
"provider": {
"order": ["ap-seoul-1", "ap-tokyo-1"],
"allow_fallbacks": true,
"quantizations": ["bf16", "fp8"],
"data_collection": "deny",
"sort": "throughput"
  },
"models": ["qwen/qwen3.8-27b", "google/gemma-4-31b-it"]
}`}
          />
        </section>

        <section>
          <h2 id="errors">에러 코드</h2>
          <Card className="mt-4 divide-y divide-line text-sm">
            {[
              ['400', '잘못된 요청 (파라미터 오류)'],
              ['401', '유효하지 않거나 비활성화된 API 키'],
              ['402', '크레딧 부족 또는 키 사용 한도 초과'],
              ['403', '키에 허용되지 않은 모델'],
              ['408', '요청 시간 초과'],
              ['429', '속도 제한 (무료 티어: 분당 20회)'],
              ['502', '업스트림 엔드포인트 오류 — 폴백 시도됨'],
              ['503', '사용 가능한 엔드포인트 없음 (커스텀 모델 콜드스타트 포함)'],
            ].map(([c, d]) => (
              <div key={c} className="flex gap-4 px-4 py-2">
                <span className="w-10 font-mono font-semibold">{c}</span>
                <span className="text-fg2">{d}</span>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h2 id="custom">커스텀 모델 API</h2>
          <p className="mt-3">대시보드의 업로드 마법사와 동일한 작업을 REST API로 수행할 수 있습니다.</p>
          <CodeBlock
            className="mt-4"
            lang="bash"
            code={`# Hugging Face에서 가져와 배포
curl https://api.inferstack.dev/v1/custom-models \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
"slug": "my-qwen-ft",
"source": { "type": "huggingface", "repo": "acme/qwen3.8-27b-ft", "revision": "main", "token": "hf_..." },
"weights": { "format": "safetensors", "dtype": "bfloat16", "quantization": "fp8" },
"architecture": "Qwen3_5ForConditionalGeneration",
"hardware": { "gpu": "H100", "count": 1, "min_replicas": 0, "max_replicas": 4 },
"context_length": 131072,
"visibility": "private"
  }'

# ModelScope / GGUF
#"source": { "type": "modelscope", "repo": "Qwen/Qwen3.8-27B-GGUF" },
#"weights": { "format": "gguf", "file": "Qwen3.8-27B-Q4_K_M.gguf" }

# 새 아키텍처: 추론 코드 패키지 지정
#"architecture": "BeamForCausalLM",
#"code": { "type": "github", "repo": "acme/beam-inferstack", "ref": "v0.1.0", "subdir": "pkg" }

# 상태 조회
curl https://api.inferstack.dev/v1/custom-models/my-qwen-ft \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY"`}
          />
        </section>

        <section>
          <h2 id="cli">CLI 레퍼런스</h2>
          <CodeBlock
            className="mt-4"
            lang="bash"
            code={`pip install -U inferstack-cli
inferstack login --key sk-is-v1-...

# 로컬 가중치 업로드 (멀티파트, 재개 가능)
inferstack models create my-model --format gguf
inferstack upload ./my-model-Q4_K_M.gguf --model my-model --parallel 8

# safetensors 디렉터리 + 커스텀 아키텍처 코드
inferstack models create beam-ft --format safetensors --arch BeamForCausalLM
inferstack upload ./beam-ft/ --model beam-ft
inferstack code push ./beam-inferstack/ --model beam-ft     # inferstack.yaml 포함 디렉터리

# 원격 소스에서 가져오기
inferstack models import hf://Qwen/Qwen3.8-27B --slug qwen-27b --gpu H100
inferstack models import modelscope://Qwen/Qwen3.8-27B --slug qwen-27b-ms

# 배포 / 상태 / 로그
inferstack deploy my-model --gpu L40S --min 0 --max 2
inferstack models status my-model
inferstack logs my-model --follow

# 패키지 로컬 검증 (배포 전)
inferstack code validate ./beam-inferstack/`}
          />
        </section>

        <section>
          <h2 id="arch">아키텍처 패키지 규격 (v1)</h2>
          <p className="mt-3">
            InferStack 레지스트리에 없는 아키텍처(<Link to="/deploy" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">지원 목록</Link>)는 아래 규격의 추론 코드 패키지를 GitHub 리포지토리 또는 로컬 디렉터리로 업로드해야 합니다. 런타임은 <code>config.json</code>의 <code>architectures[0]</code>와 매니페스트의 <code>metadata.architectures</code>를 매칭하여 엔트리포인트 클래스를 로드합니다.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-raised p-4 font-mono text-xs">{SPEC_TREE}</pre>
          <h3>inferstack.yaml</h3>
          <CodeBlock className="mt-3" lang="yaml" code={manifestTemplate('BeamForCausalLM', 'beam')} />
          <h3>model.py — InferStackModel 인터페이스</h3>
          <Card className="mt-3 divide-y divide-line text-sm">
            {[
              ['load(weights_dir, config, device_map)', '가중치 로드. 텐서 병렬 rank 정보가 device_map으로 전달됩니다.'],
              ['tokenize(messages, tools)', '채팅 메시지 → 토큰 ID. 채팅 템플릿 적용 책임.'],
              ['generate(req) → Iterator[TokenChunk]', '토큰을 yield 하면 런타임이 SSE 스트리밍·과금·stop 처리.'],
              ['health() → bool', '헬스체크. False면 레플리카가 교체됩니다.'],
            ].map(([a, b]) => (
              <div key={a} className="px-4 py-2.5">
                <div className="font-mono text-xs font-medium">{a}</div>
                <div className="text-fg2">{b}</div>
              </div>
            ))}
          </Card>
          <CodeBlock className="mt-4" lang="python" code={modelPyTemplate('BeamForCausalLM')} />
          <h3>requirements.txt</h3>
          <CodeBlock className="mt-3" lang="text" code={REQUIREMENTS_TEMPLATE} />
          <h3>검증 규칙</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-fg2">
            <li>
              <code>inferstack.yaml</code>, <code>model.py</code> 필수 · 패키지 크기 50MB 이하 (가중치 포함 금지)
            </li>
            <li>
              <code>runtime.base</code>가 <code>vllm</code>/<code>sglang</code>이면 해당 엔진의 모델 플러그인 API로 등록, <code>custom</code>이면 <code>generate()</code>를 직접 호출
            </li>
            <li>빌드는 네트워크 격리 환경에서 requirements.txt만 설치 후 실행됩니다</li>
            <li>
              <code>tests/test_smoke.py</code>가 있으면 배포 전 tiny-random 가중치로 실행됩니다
            </li>
          </ul>
        </section>

        <section>
          <h2 id="billing">과금</h2>
          <p className="mt-3">
            카탈로그 모델은 입력/출력 토큰 단위로 과금되며 캐시된 입력 토큰은 75% 할인됩니다. 비공개 커스텀 모델은 GPU 사용 시간(초 단위)으로, 마켓플레이스 공개 모델은 호출자에게 토큰 단위로 과금되고 제공자에게 매출의 80%가 정산됩니다. 자세한 내용은{' '}
            <Link to="/pricing" className="text-fg underline decoration-line2 underline-offset-4 hover:decoration-fg">
              가격
            </Link>{' '}
            페이지를 참고하세요.
          </p>
        </section>
      </article>
    </div>
  )
}
