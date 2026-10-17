import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, X } from 'lucide-react'
import { MODELS, findModel } from '../data/models'
import { ARCHITECTURES } from '../data/architectures'
import type { CatalogModel } from '../data/types'
import { ModelTable, SORTS, sortModels, type SortKey } from '../components/ModelTable'
import { CodeBlock, CopyButton, Segmented, cx } from '../components/ui'
import { CONTAINER } from '../components/Layout'
import { fmtPrice } from '../lib/format'

const BASE_URL = 'https://api.inferstack.dev/v1'

const CHIPS: { id: string; label: string; test: (m: CatalogModel) => boolean }[] = [
  { id: 'all', label: '전체', test: () => true },
  { id: 'coding', label: '코딩', test: (m) => m.capabilities.includes('coding') },
  { id: 'reasoning', label: '추론', test: (m) => m.capabilities.includes('reasoning') },
  { id: 'vision', label: '이미지 입력', test: (m) => m.input.includes('image') },
  { id: 'agent', label: '에이전트', test: (m) => m.capabilities.includes('agent') },
  { id: '1m', label: '1M 컨텍스트', test: (m) => m.context >= 1_000_000 },
  { id: 'free', label: '무료 티어', test: (m) => !!m.free },
]

export default function Home() {
  const [q, setQ] = useState('')
  const [chip, setChip] = useState('all')
  const [sort, setSort] = useState<SortKey>('popular')
  const [codeSlug, setCodeSlug] = useState(MODELS[0].slug)
  const [picked, setPicked] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const test = CHIPS.find((c) => c.id === chip)!.test
    return sortModels(
      MODELS.filter((m) => test(m) && (!ql || [m.name, m.slug, m.orgName, m.architecture, ...m.capabilities].join(' ').toLowerCase().includes(ql))),
      sort,
    )
  }, [q, chip, sort])
  const shown = filtered.slice(0, 10)

  const showCode = (slug: string) => {
    setCodeSlug(slug)
    setPicked(true)
    codeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div>
      {/* 1. 검색이 이 페이지의 유일한 시작점 */}
      <section className={cx(CONTAINER, 'pt-16 sm:pt-24')}>
        <h1 className="text-[40px] font-bold leading-[1.08] tracking-[-0.045em] sm:text-[60px]">
          오픈 웨이트 모델을
          <br />
          API 하나로
        </h1>
        <p className="mt-5 max-w-[38rem] text-[17px] leading-[1.65] text-fg2">
          DeepSeek, Qwen, GLM, Kimi 등 {MODELS.length}종을 OpenAI SDK 그대로 호출하세요. 직접 학습한 모델도 올리면 같은 API로 서빙됩니다.
        </p>

        <div className="mt-10 flex h-14 max-w-[44rem] items-center gap-3 rounded-xl border border-line2 bg-panel px-4 transition-colors focus-within:border-fg/40">
          <Search size={20} className="shrink-0 text-fg3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="모델, 제작사, 아키텍처로 찾기"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-fg placeholder:text-fg3 focus:outline-none"
            aria-label="모델 검색"
          />
          {q && (
            <button onClick={() => setQ('')} className="rounded p-1 text-fg3 hover:text-fg" aria-label="검색어 지우기">
              <X size={16} />
            </button>
          )}
          <span className="tabular shrink-0 font-mono text-[13px] text-fg3">{filtered.length}개</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChip(c.id)}
              className={cx('h-8 rounded-full border px-3.5 text-[13px] transition-colors', chip === c.id ? 'border-fg bg-fg text-bg' : 'border-line2 text-fg2 hover:border-fg/40 hover:text-fg')}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* 2. 표가 본문 */}
      <section className={cx(CONTAINER, 'pb-20 pt-12')}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex gap-5">
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)} className={cx('text-[14px] transition-colors', sort === s.id ? 'font-semibold text-fg' : 'text-fg3 hover:text-fg')}>
                {s.label}
              </button>
            ))}
          </div>
          <Link to="/models" className="inline-flex shrink-0 items-center gap-1 text-[13px] text-fg2 hover:text-fg">
            {MODELS.length}개 모두 보기 <ArrowRight size={13} />
          </Link>
        </div>
        {shown.length ? (
          <ModelTable models={shown} onCode={showCode} codeSlug={picked ? codeSlug : undefined} />
        ) : (
          <div className="border-t border-line py-16 text-center text-[14px] text-fg2">
            "{q}"에 맞는 모델이 없습니다.{' '}
            <button
              onClick={() => {
                setQ('')
                setChip('all')
              }}
              className="text-fg underline underline-offset-4"
            >
              조건 지우기
            </button>
          </div>
        )}
        <p className="mt-4 text-[12px] text-fg3">속도와 주간 토큰은 데모용 예시 값입니다. 행에 마우스를 올리면 호출 코드와 채팅 버튼이 나타납니다.</p>
      </section>

      <CallSection slug={codeSlug} setSlug={setCodeSlug} codeRef={codeRef} />
      <UploadSection />
      <BillingStrip />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mt-8 border-b border-line">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-4 border-t border-line py-3.5 text-[14px]">
          <dt className="text-fg3">{k}</dt>
          <dd className="min-w-0 text-fg">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function callCode(lang: string, slug: string) {
  if (lang === 'python')
    return `from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}",
    api_key="<INFERSTACK_API_KEY>",
)

r = client.chat.completions.create(
    model="${slug}",
    messages=[{"role": "user", "content": "안녕하세요"}],
)
print(r.choices[0].message.content)`
  if (lang === 'ts')
    return `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "${BASE_URL}",
  apiKey: process.env.INFERSTACK_API_KEY,
})

const r = await client.chat.completions.create({
  model: "${slug}",
  messages: [{ role: "user", content: "안녕하세요" }],
})
console.log(r.choices[0].message.content)`
  return `curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${slug}", "messages": [{"role": "user", "content": "안녕하세요"}]}'`
}

function CallSection({ slug, setSlug, codeRef }: { slug: string; setSlug: (s: string) => void; codeRef: React.RefObject<HTMLDivElement> }) {
  const [lang, setLang] = useState<'python' | 'ts' | 'curl'>('python')
  const m = findModel(slug)
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'grid gap-12 py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]')}>
        <div>
          <h2 className="text-[28px] font-bold leading-tight tracking-[-0.035em]">기존 코드에서 base URL만 바꾸세요</h2>
          <Facts
            rows={[
              [
                'Base URL',
                <span className="flex items-center gap-1">
                  <code className="truncate font-mono text-[13.5px]">{BASE_URL}</code>
                  <CopyButton text={BASE_URL} />
                </span>,
              ],
              ['호환', 'OpenAI Chat Completions, 스트리밍, 툴 호출, JSON 모드, 이미지 입력'],
              ['장애 시', '같은 모델의 다른 리전으로 자동 재시도 (서울 → 도쿄)'],
              ['데이터', '프롬프트와 응답은 기본적으로 저장하지 않음'],
            ]}
          />
          <Link to="/keys" className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-lg bg-fg px-5 text-[15px] font-medium text-bg hover:bg-fg/85">
            API 키 받기 <ArrowRight size={16} />
          </Link>
        </div>
        <div ref={codeRef} className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-w-0 items-center gap-2 text-[13px] text-fg3">
              모델
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className="h-8 min-w-0 rounded-lg border border-line2 bg-panel px-2 font-mono text-[12.5px] text-fg focus:outline-none">
                {MODELS.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.slug}
                  </option>
                ))}
              </select>
            </label>
            <Segmented
              value={lang}
              onChange={setLang}
              options={[
                { id: 'python', label: 'Python' },
                { id: 'ts', label: 'TypeScript' },
                { id: 'curl', label: 'cURL' },
              ]}
            />
          </div>
          <CodeBlock code={callCode(lang, slug)} lang={lang === 'curl' ? 'bash' : lang} />
          {m && (
            <p className="tabular mt-3 font-mono text-[12.5px] text-fg3">
              {m.name} · 입력 {fmtPrice(m.price.input)}/1M · 출력 {fmtPrice(m.price.output)}/1M
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function UploadSection() {
  const nav = useNavigate()
  const [source, setSource] = useState<'huggingface' | 'modelscope' | 'cli'>('huggingface')
  const [repo, setRepo] = useState('')
  const examples = source === 'modelscope' ? ['ZhipuAI/GLM-4.7-Flash', 'Qwen/Qwen3.8-27B'] : ['Qwen/Qwen3.8-27B', 'LiquidAI/LFM2.5-24B-A2B-GGUF', 'openai/gpt-oss-20b']
  const go = (r = repo) => r.trim() && nav(`/deploy/new?source=${source}&repo=${encodeURIComponent(r.trim())}`)
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'grid gap-12 py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]')}>
        <div>
          <h2 className="text-[28px] font-bold leading-tight tracking-[-0.035em]">직접 학습한 모델도 같은 API로</h2>
          <Facts
            rows={[
              ['가져오기', 'Hugging Face, ModelScope, CLI 업로드'],
              ['포맷', 'GGUF (Q8_0 ~ IQ1), Safetensors (BF16 · FP8 · MXFP4)'],
              ['아키텍처', `config.json에서 자동 감지 (${ARCHITECTURES.length}종). 없는 아키텍처는 추론 코드를 함께 업로드`],
              ['과금', '비공개는 GPU 사용 시간, 공개하면 토큰 매출의 80% 정산'],
            ]}
          />
        </div>
        <div className="min-w-0 self-start rounded-xl border border-line2 bg-panel p-6">
          <Segmented
            value={source}
            onChange={setSource}
            options={[
              { id: 'huggingface', label: 'Hugging Face' },
              { id: 'modelscope', label: 'ModelScope' },
              { id: 'cli', label: 'CLI' },
            ]}
          />
          {source === 'cli' ? (
            <CodeBlock
              className="mt-5"
              lang="bash"
              lineNumbers={false}
              code={`pip install inferstack-cli
inferstack upload ./my-model-Q4_K_M.gguf --model my-model
inferstack deploy my-model --gpu L40S`}
            />
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  go()
                }}
                className="mt-5 flex gap-2"
              >
                <input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder={source === 'huggingface' ? 'organization/model' : 'owner/model'}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-line2 bg-bg px-3.5 font-mono text-[14px] text-fg placeholder:text-fg3 focus:border-fg/40 focus:outline-none"
                  aria-label="리포지토리 ID"
                />
                <button type="submit" disabled={!repo.trim()} className="h-11 shrink-0 rounded-lg bg-fg px-5 text-[14px] font-medium text-bg hover:bg-fg/85 disabled:opacity-40">
                  불러오기
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px]">
                <span className="text-fg3">예시</span>
                {examples.map((r) => (
                  <button key={r} onClick={() => go(r)} className="font-mono text-fg2 underline decoration-line2 underline-offset-4 hover:text-fg hover:decoration-fg">
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="mt-6 border-t border-line pt-4 text-[13px] leading-relaxed text-fg2">
            {source === 'cli' ? '업로드가 끝나면 웹에서 아키텍처와 GPU를 확인하고 배포합니다.' : '불러오면 파일 목록, 아키텍처, 양자화 파일, 필요한 GPU를 분석해 다음 단계에 채워 둡니다.'}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function BillingStrip() {
  const items = [
    ['원화 충전', '카드, 계좌이체, 법인카드'],
    ['세금계산서', '매월 사용분 자동 발행'],
    ['서울 리전 우선', 'ap-seoul-1, 장애 시 도쿄'],
  ]
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'grid gap-8 py-14 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center')}>
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.03em]">한국 팀을 위한 결제</h2>
          <p className="mt-1.5 text-[14px] text-fg2">해외 카드 결제 없이 원화로 쓰고 세금계산서를 받습니다.</p>
        </div>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map(([k, v]) => (
            <div key={k} className="border-l border-line2 pl-4">
              <dt className="text-[14px] font-semibold">{k}</dt>
              <dd className="mt-1 text-[13px] text-fg2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
