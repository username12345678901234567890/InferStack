import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, Cpu, Download, Github, Globe2, Heart, KeyRound, Route, Search, ShieldCheck, Terminal, Upload, Zap } from 'lucide-react'
import { MODELS, weeklyTokens } from '../data/models'
import { ModelTile } from '../components/ModelBits'
import { Badge, Button, Card, CodeBlock, Segmented } from '../components/ui'
import { LogoMark } from '../components/Logo'
import { trendingLLMs, hfUrl, type HFModelSummary } from '../lib/hf'
import { fmtNum, fmtTokens, timeAgo } from '../lib/format'

const SAMPLES = {
  python: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.inferstack.dev/v1",
    api_key="<INFERSTACK_API_KEY>",
)

completion = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "인생의 의미는?"}],
)
print(completion.choices[0].message.content)`,
  ts: `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.inferstack.dev/v1",
  apiKey: process.env.INFERSTACK_API_KEY,
})

const res = await client.chat.completions.create({
  model: "z-ai/glm-5.3",
  messages: [{ role: "user", content: "인생의 의미는?" }],
})
console.log(res.choices[0].message.content)`,
  curl: `curl https://api.inferstack.dev/v1/chat/completions \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen/qwen3.8-27b",
    "messages": [{"role": "user", "content": "인생의 의미는?"}]
  }'`,
}

export default function Home() {
  const [q, setQ] = useState('')
  const [lang, setLang] = useState<'python' | 'ts' | 'curl'>('python')
  const nav = useNavigate()
  const featured = [...MODELS].filter((m) => m.isNew).slice(0, 8)
  const top = [...MODELS].sort((a, b) => weeklyTokens(b) - weeklyTokens(a)).slice(0, 8)
  const totalWeekly = MODELS.reduce((s, m) => s + weeklyTokens(m), 0)

  return (
    <div className="-mt-8">
      {/* hero */}
      <section className="relative overflow-hidden pb-16 pt-16 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600/25 via-indigo-500/15 to-accent-500/25 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.08)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <Link to="/models?sort=newest" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur hover:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Badge color="cyan">NEW</Badge> LFM2.5-24B-A2B · Ling-3.1-flash · GLM-5.3 지원 시작 <ArrowRight size={12} />
          </Link>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            모든 오픈 모델을,
            <br />
            <span className="bg-gradient-to-r from-brand-500 via-indigo-400 to-accent-400 bg-clip-text text-transparent">하나의 API로.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            DeepSeek V4, Qwen3.8, GLM-5.3, Kimi K3까지 — 최신 오픈소스 LLM을 OpenAI 호환 엔드포인트로 즉시 호출하세요. 내 모델도 업로드하면 몇 분 만에 서버리스로 배포됩니다.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              nav(`/models${q ? `?q=${encodeURIComponent(q)}` : ''}`)
            }}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-brand-900/5 dark:border-white/10 dark:bg-slate-900/80"
          >
            <Search size={18} className="ml-2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${MODELS.length}개 모델 검색 — 예: "coding", "vision", "deepseek"`} className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
            <Button type="submit">검색</Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/chat">
              <Button size="lg">
                채팅으로 바로 써보기 <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/deploy">
              <Button size="lg" variant="outline">
                <Upload size={16} /> 내 모델 업로드
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['주간 처리 토큰', fmtTokens(totalWeekly)],
            ['지원 모델', `${MODELS.length}+`],
            ['글로벌 리전', '5'],
            ['평균 TTFT', '310ms'],
          ].map(([l, v]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-bold tracking-tight sm:text-3xl">{v}</div>
              <div className="mt-1 text-xs text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* featured */}
      <section className="py-8">
        <SectionHead title="새로 추가된 모델" href="/models?sort=newest" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((m) => (
            <ModelTile key={m.slug} m={m} />
          ))}
        </div>
      </section>

      <section className="py-8">
        <SectionHead title="이번 주 가장 많이 쓰인 모델" href="/rankings" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {top.map((m) => (
            <ModelTile key={m.slug} m={m} />
          ))}
        </div>
      </section>

      {/* features */}
      <section className="py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Route, title: '스마트 라우팅 & 폴백', desc: '리전·GPU·양자화가 다른 여러 엔드포인트 중 가장 빠르고 저렴한 곳으로 자동 라우팅. 장애 시 즉시 폴백합니다.' },
            { icon: KeyRound, title: 'OpenAI 호환 API', desc: 'base_url만 바꾸면 됩니다. 스트리밍, 툴 호출, JSON 모드, 비전 입력, 프롬프트 캐싱까지 그대로.' },
            { icon: Zap, title: '종량제 크레딧', desc: '구독 없이 토큰만큼만 결제. API 키별 사용 한도, 만료일, 모델 허용 목록을 세밀하게 설정하세요.' },
            { icon: Upload, title: '커스텀 모델 업로드', desc: 'Hugging Face · ModelScope · CLI로 GGUF/Safetensors 가중치를 가져와 전용 엔드포인트로 배포.' },
            { icon: Cpu, title: '새 아키텍처도 Day-0', desc: '레지스트리에 없는 아키텍처라면 규격에 맞춘 추론 코드를 GitHub 또는 로컬에서 업로드하세요.' },
            { icon: ShieldCheck, title: '프라이버시 우선', desc: '프롬프트 로깅은 기본 OFF. 학습 데이터 사용 금지 엔드포인트만 선택하는 옵션을 제공합니다.' },
          ].map((f) => (
            <Card key={f.title} className="p-5">
              <f.icon size={20} className="text-brand-500" />
              <div className="mt-3 font-semibold">{f.title}</div>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* code */}
      <section className="grid items-center gap-10 py-10 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <Badge color="brand">개발자</Badge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">기존 코드 그대로, 3줄 변경으로</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">OpenAI SDK, LangChain, LlamaIndex, Vercel AI SDK 등 OpenAI 호환 클라이언트라면 무엇이든 동작합니다. 모델 이름만 바꿔 36개 이상의 오픈 모델을 비교해 보세요.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/keys">
              <Button>
                <KeyRound size={16} /> API 키 발급
              </Button>
            </Link>
            <Link to="/docs">
              <Button variant="outline">문서 보기</Button>
            </Link>
          </div>
        </div>
        <div>
          <Segmented
            className="mb-2"
            value={lang}
            onChange={setLang}
            options={[
              { id: 'python', label: 'Python' },
              { id: 'ts', label: 'TypeScript' },
              { id: 'curl', label: 'cURL' },
            ]}
          />
          <CodeBlock code={SAMPLES[lang]} lang={lang === 'curl' ? 'bash' : lang} />
        </div>
      </section>

      {/* BYOM */}
      <section className="py-16">
        <Card className="relative overflow-hidden p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 opacity-20">
            <LogoMark size={320} />
          </div>
          <div className="relative max-w-2xl">
            <Badge color="violet">Bring Your Own Model</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">내 모델, 3가지 방법으로 업로드</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">GGUF·Safetensors 포맷을 지원하며 config.json에서 아키텍처를 자동 감지합니다. 배포한 모델은 비공개로 쓰거나 마켓플레이스에 공개해 수익을 얻을 수 있습니다.</p>
          </div>
          <div className="relative mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: Download, title: 'Hugging Face에서 불러오기', desc: 'repo ID만 입력하면 파일 목록·아키텍처·컨텍스트 길이를 자동으로 읽어옵니다. 게이트/비공개 모델은 토큰 지원.', to: '/deploy/new?source=huggingface' },
              { icon: Globe2, title: 'ModelScope에서 불러오기', desc: 'ModelScope 리포지토리를 그대로 가져옵니다. 중국 리전 미러로 대형 가중치도 빠르게.', to: '/deploy/new?source=modelscope' },
              { icon: Terminal, title: 'CLI로 업로드', desc: '`inferstack upload` 한 줄로 로컬 가중치를 재개 가능한 멀티파트 업로드로 전송합니다.', to: '/deploy/new?source=cli' },
            ].map((x) => (
              <Link key={x.title} to={x.to}>
                <div className="h-full rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition-colors hover:border-brand-400 dark:border-white/10 dark:bg-white/[0.03]">
                  <x.icon size={20} className="text-brand-500" />
                  <div className="mt-3 font-semibold">{x.title}</div>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{x.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="relative mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Boxes size={14} /> 새 아키텍처? <Github size={14} /> GitHub 또는 로컬에서 <Link to="/docs#arch" className="text-brand-500 hover:underline">InferStack Architecture Package</Link> 규격의 추론 코드를 함께 업로드하세요.
          </div>
        </Card>
      </section>

      <HFTrending />
    </div>
  )
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link to={href} className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-500">
        전체 보기 <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function HFTrending() {
  const [items, setItems] = useState<HFModelSummary[] | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    trendingLLMs(9)
      .then(setItems)
      .catch(() => setErr(true))
  }, [])
  return (
    <section className="py-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span>🤗</span> Hugging Face 실시간 트렌딩
          </h2>
          <p className="text-sm text-slate-500">huggingface.co API에서 실시간으로 불러옵니다. 클릭 한 번으로 InferStack에 배포하세요.</p>
        </div>
      </div>
      {err && <Card className="p-6 text-sm text-slate-500">Hugging Face API에 연결할 수 없습니다 (오프라인 또는 네트워크 차단).</Card>}
      {!items && !err && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
          ))}
        </div>
      )}
      {items && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <Card key={m.id} className="flex min-w-0 items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <a href={hfUrl(m.id)} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:text-brand-500">
                  {m.id}
                </a>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart size={11} /> {fmtNum(m.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={11} /> {fmtTokens(m.downloads)}
                  </span>
                  {m.createdAt && <span>{timeAgo(m.createdAt)}</span>}
                </div>
              </div>
              <Link to={`/deploy/new?source=huggingface&repo=${encodeURIComponent(m.id)}`}>
                <Button size="sm" variant="secondary">
                  배포
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
