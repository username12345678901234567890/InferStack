import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, MessageSquare } from 'lucide-react'
import { MODELS, ORGS, REGIONS, endpointsFor, findModel, weeklyTokens } from '../data/models'
import { ARCHITECTURES } from '../data/architectures'
import type { CatalogModel } from '../data/types'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { ButtonLink, CopyButton, Segmented, buttonClass, cx, highlight } from '../components/ui'
import { CONTAINER } from '../components/Layout'
import { fmtCtx, fmtPrice, fmtTokens, fmtUSD } from '../lib/format'

export default function Home() {
  return (
    <div>
      <Hero />
      <Pulse />
      <Showcase />
      <Start />
      <Upload />
      <Regions />
    </div>
  )
}

const SECTION = 'py-16 sm:py-20'

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(q.matches)
    const h = () => setReduce(q.matches)
    q.addEventListener('change', h)
    return () => q.removeEventListener('change', h)
  }, [])
  return reduce
}

/** Shared section heading: always left-aligned */
function Head({ title, sub, action }: { title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[30px]">{title}</h2>
        {sub && <p className="mt-2 text-[15.5px] leading-relaxed text-fg2">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className={cx(CONTAINER, 'grid grid-cols-1 items-center gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-14')}>
      <div>
        <h1 className="text-[42px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[60px]">
          One API for
          <br />
          every open model
        </h1>
        <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-fg2 sm:text-[18px]">
          {MODELS.length} open-weight models from {ORGS.length} labs, and your own fine-tunes, behind one OpenAI-compatible endpoint. Pay per token.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink to="/keys" size="xl" className="w-full sm:w-auto">
            Get your API key <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink to="/chat" size="xl" variant="outline" className="w-full sm:w-auto">
            Try it in chat
          </ButtonLink>
        </div>
      </div>
      <LiveDemo />
    </section>
  )
}

const DEMO = [
  {
    model: 'deepseek/deepseek-v4.1-flash',
    prompt: 'Explain the KV cache in two sentences.',
    answer:
      'A KV cache keeps the key and value tensors of tokens the model has already seen, so each new token attends to stored states instead of recomputing the whole prefix. Generation gets much faster, at the cost of GPU memory that grows with context length.',
    code: false,
  },
  {
    model: 'qwen/qwen3.8-27b',
    prompt: 'SQL for daily active users from an events table.',
    answer: "SELECT date_trunc('day', ts) AS day,\n       count(DISTINCT user_id) AS dau\nFROM events GROUP BY 1 ORDER BY 1;",
    code: true,
  },
  {
    model: 'z-ai/glm-5.3',
    prompt: 'Return as JSON: "Paid $1,240.50 to Acme on Oct 3"',
    answer: '{\n  "payee": "Acme",\n  "amount": 1240.5,\n  "currency": "USD",\n  "date": "2026-10-03"\n}',
    code: true,
  },
  {
    model: 'moonshotai/kimi-k3',
    prompt: 'Regex for a semantic version like 1.4.2',
    answer: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$',
    code: true,
  },
]

function LiveDemo() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const [phase, setPhase] = useState<'wait' | 'stream' | 'done'>('wait')
  const d = DEMO[i]
  const m = findModel(d.model)!
  const ep = useMemo(() => endpointsFor(m)[0], [m])

  // play the current request: wait for the first token, then stream
  useEffect(() => {
    if (reduce) {
      setN(d.answer.length)
      setPhase('done')
      return
    }
    setN(0)
    setPhase('wait')
    let count = 0
    let tick: number | undefined
    const start = window.setTimeout(() => {
      setPhase('stream')
      const step = Math.max(1, Math.round(ep.throughput / 40))
      tick = window.setInterval(() => {
        count = Math.min(d.answer.length, count + step)
        setN(count)
        if (count >= d.answer.length) {
          window.clearInterval(tick)
          setPhase('done')
        }
      }, 28)
    }, Math.min(900, ep.latency))
    return () => {
      window.clearTimeout(start)
      window.clearInterval(tick)
    }
  }, [i, reduce, d.answer, ep])

  // then move on to the next model
  useEffect(() => {
    if (phase !== 'done' || reduce) return
    const t = window.setTimeout(() => setI((x) => (x + 1) % DEMO.length), 3400)
    return () => window.clearTimeout(t)
  }, [phase, reduce])

  const completion = Math.ceil(n / 4)
  const cost = (14 * m.price.input + completion * m.price.output) / 1e6

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line2 bg-panel">
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5">
        {DEMO.map((x, k) => {
          const mm = findModel(x.model)!
          return (
            <button
              key={x.model}
              onClick={() => setI(k)}
              className={cx('flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[12.5px] transition-colors', k === i ? 'bg-raised font-medium text-fg ring-1 ring-inset ring-line2' : 'text-fg3 hover:text-fg')}
            >
              <OrgAvatar org={mm.org} name={mm.orgName} size={18} className="!rounded-full" />
              {mm.name}
            </button>
          )
        })}
      </div>

      {/* every exchange sits in the same grid cell, so the card is always as tall as the longest one */}
      <div className="grid px-5 py-5">
        {DEMO.map((x, k) => (
          <div key={x.model} className={cx('[grid-area:1/1]', k !== i && 'invisible')} aria-hidden={k !== i}>
            <Exchange prompt={x.prompt} answer={x.answer} code={x.code} model={findModel(x.model)!} shown={k === i ? n : x.answer.length} phase={k === i ? phase : 'done'} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 border-t border-line px-5 py-3 text-[12.5px] text-fg3">
        <span className="tabular">
          <span className="text-fg2">{phase === 'wait' ? '—' : `${(ep.latency / 1000).toFixed(2)}s`}</span> latency
        </span>
        <span className="tabular hidden sm:inline">
          <span className="text-fg2">{phase === 'wait' ? '—' : ep.throughput}</span> tok/s
        </span>
        <span className="tabular text-fg2">{fmtUSD(cost)}</span>
        <Link to={`/chat?model=${encodeURIComponent(m.slug)}`} className="ml-auto flex items-center gap-1 font-medium text-fg transition-colors hover:text-accent">
          Open in chat <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

function Exchange({ prompt, answer, code, model, shown, phase }: { prompt: string; answer: string; code: boolean; model: CatalogModel; shown: number; phase: 'wait' | 'stream' | 'done' }) {
  return (
    <>
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-raised px-3.5 py-2 text-[14px]">{prompt}</div>
      </div>
      <div className="mt-4 flex gap-3">
        <OrgAvatar org={model.org} name={model.orgName} size={24} className="mt-0.5 shrink-0" />
        <div className={cx('min-w-0 flex-1 whitespace-pre-wrap text-[14px] leading-relaxed', code && 'rounded-xl bg-raised px-3.5 py-3 font-mono text-[12.5px] leading-[1.7]')}>
          {phase === 'wait' ? (
            <span className="inline-flex gap-1 py-2">
              {[0, 1, 2].map((k) => (
                <span key={k} className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg3" style={{ animationDelay: `${k * 150}ms` }} />
              ))}
            </span>
          ) : (
            <>
              {code ? highlight(answer.slice(0, shown), 'sql') : answer.slice(0, shown)}
              {phase === 'stream' && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-fg" />}
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Catalog numbers                                                     */
/* ------------------------------------------------------------------ */

function Pulse() {
  // all four numbers come straight from the catalog
  const cheapest = Math.min(...MODELS.map((m) => m.price.input))
  const stats = [
    { v: `${fmtPrice(cheapest)}/M`, k: 'Starting price' },
    { v: String(MODELS.length), k: 'Models' },
    { v: String(ORGS.length), k: 'Labs' },
    { v: String(REGIONS.length), k: 'Regions' },
  ]
  return (
    <section className="border-y border-line">
      {/* same 4-column grid as the catalog cards below, so the columns line up */}
      <dl className={cx(CONTAINER, 'grid grid-cols-2 gap-x-3 gap-y-6 py-9 lg:grid-cols-4 lg:gap-x-4')}>
        {stats.map((s) => (
          <div key={s.k} className="min-w-0">
            <dt className="tabular truncate text-[28px] font-semibold tracking-[-0.03em]">{s.v}</dt>
            <dd className="mt-1 text-[13.5px] text-fg3">{s.k}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Catalog showcase                                                    */
/* ------------------------------------------------------------------ */

type Tab = 'trending' | 'new' | 'free' | 'coding' | 'vision' | 'long'

const TABS: { id: Tab; label: string; pick: (m: CatalogModel) => boolean; sort?: (a: CatalogModel, b: CatalogModel) => number }[] = [
  { id: 'trending', label: 'Trending', pick: () => true },
  { id: 'new', label: 'New', pick: (m) => !!m.isNew, sort: (a, b) => b.released.localeCompare(a.released) },
  { id: 'free', label: 'Free tier', pick: (m) => !!m.free },
  { id: 'coding', label: 'Coding', pick: (m) => m.capabilities.includes('coding') },
  { id: 'vision', label: 'Vision', pick: (m) => m.input.includes('image') },
  { id: 'long', label: '1M context', pick: (m) => m.context >= 1_000_000 },
]

function Showcase() {
  const [tab, setTab] = useState<Tab>('trending')
  const t = TABS.find((x) => x.id === tab)!
  const list = MODELS.filter(t.pick)
    .sort(t.sort ?? ((a, b) => weeklyTokens(b) - weeklyTokens(a)))
    .slice(0, 12)
  return (
    <section className={cx(CONTAINER, SECTION)}>
      <Head
        title="Popular models"
        action={
          <Link to="/models" className="flex items-center gap-1 text-[14px] font-medium text-fg2 transition-colors hover:text-fg">
            All {MODELS.length} models <ArrowRight size={14} />
          </Link>
        }
      />
      <div className="-mx-5 mb-6 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <Segmented value={tab} onChange={setTab} options={TABS.map((x) => ({ id: x.id, label: x.label }))} className="[&>button]:px-3.5 [&>button]:py-1.5 [&>button]:text-[13px]" />
      </div>
      <div key={tab} className="grid animate-fade-in gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((m, i) => (
          <ModelCard key={m.slug} m={m} className={i >= 6 ? 'hidden sm:flex' : undefined} />
        ))}
      </div>
    </section>
  )
}

function ModelCard({ m, className }: { m: CatalogModel; className?: string }) {
  const nav = useNavigate()
  return (
    <div className={cx('group relative flex flex-col rounded-2xl border border-line bg-panel p-4 transition-colors hover:border-line2 hover:bg-raised/40', className)}>
      <Link to={`/models/${m.slug}`} className="absolute inset-0 rounded-2xl" aria-label={m.name} />
      <div className="flex items-center gap-3">
        <OrgAvatar org={m.org} name={m.orgName} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">{m.name}</div>
          <div className="text-[12.5px] text-fg3">{m.orgName}</div>
        </div>
        <button
          onClick={() => nav(`/chat?model=${encodeURIComponent(m.slug)}`)}
          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg3 opacity-0 transition hover:bg-raised hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
          title={`Chat with ${m.name}`}
          aria-label={`Chat with ${m.name}`}
        >
          <MessageSquare size={15} />
        </button>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-relaxed text-fg2">{m.description}</p>
      <div className="mt-4 flex items-center gap-1.5">
        <ModelFlags m={m} />
        <span className="tabular ml-auto whitespace-nowrap text-[12.5px] text-fg2">
          {fmtPrice(m.price.input)} <span className="text-fg3">in</span> · {fmtPrice(m.price.output)} <span className="text-fg3">out</span>
        </span>
      </div>
      <div className="tabular mt-1.5 flex justify-between text-[12px] text-fg3">
        <span>{fmtCtx(m.context)} context</span>
        <span>{fmtTokens(weeklyTokens(m))} tokens/wk</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Get started                                                         */
/* ------------------------------------------------------------------ */

const SNIPPETS = {
  python: {
    lang: 'python',
    code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.inferstack.dev/v1",
    api_key="sk-is-v1-...",
)

res = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(res.choices[0].message.content)`,
  },
  typescript: {
    lang: 'ts',
    code: `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.inferstack.dev/v1",
  apiKey: process.env.INFERSTACK_API_KEY,
})

const res = await client.chat.completions.create({
  model: "deepseek/deepseek-v4.1-flash",
  messages: [{ role: "user", content: "Hello!" }],
})
console.log(res.choices[0].message.content)`,
  },
  curl: {
    lang: 'bash',
    code: `curl https://api.inferstack.dev/v1/chat/completions \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek/deepseek-v4.1-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
  },
}

function Start() {
  const [lang, setLang] = useState<keyof typeof SNIPPETS>('python')
  const steps = [
    ['Create an API key', 'New accounts start with $5 of credit.'],
    ['Set the base URL', 'https://api.inferstack.dev/v1 in any OpenAI SDK.'],
    ['Pick a model', 'Use the model ID from its page, e.g. deepseek/deepseek-v4.1-flash.'],
  ]
  const s = SNIPPETS[lang]
  return (
    <section className={cx(CONTAINER, SECTION, 'grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16')}>
      <div>
        <Head title="Quickstart" />
        <ol className="space-y-5">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="tabular w-5 shrink-0 pt-px text-[15px] font-semibold text-fg3">{i + 1}.</span>
              <div className="min-w-0">
                <div className="text-[15.5px] font-semibold">{t}</div>
                <p className="mt-0.5 break-words text-[14.5px] text-fg2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link to="/docs" className="mt-8 inline-flex items-center gap-1 text-[14px] font-medium text-fg2 transition-colors hover:text-fg">
          Read the docs <ArrowRight size={14} />
        </Link>
      </div>
      <div className="code-panel min-w-0 self-center overflow-hidden rounded-2xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { id: 'python', label: 'Python' },
              { id: 'typescript', label: 'TypeScript' },
              { id: 'curl', label: 'cURL' },
            ]}
          />
          <CopyButton text={s.code} label="Copy" className="hover:bg-fg/[0.06]" />
        </div>
        <pre className="overflow-x-auto py-5 font-mono text-[13px] leading-[1.75]">
          <code className="block min-w-max">
            {s.code.split('\n').map((l, i) => (
              <span key={i} className={cx('block px-5', /base_url|baseURL|api\.inferstack\.dev/.test(l) && 'bg-accent/[0.08]')}>
                {highlight(l, s.lang)}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Bring your own model                                                */
/* ------------------------------------------------------------------ */

function Upload() {
  const nav = useNavigate()
  const [source, setSource] = useState<'huggingface' | 'modelscope'>('huggingface')
  const [repo, setRepo] = useState('')
  const go = (r = repo) => r.trim() && nav(`/deploy/new?source=${source}&repo=${encodeURIComponent(r.trim())}`)
  const quants = [
    ['Q8_0', '25.5 GB'],
    ['Q6_K', '19.7 GB'],
    ['Q4_K_M', '14.5 GB'],
  ]
  return (
    <section className="bg-raised/50">
      <div className={cx(CONTAINER, SECTION, 'grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16')}>
        <div>
          <Head
            title="Deploy your own model"
            sub={`Paste a Hugging Face or ModelScope repo ID. InferStack reads the architecture and quantized files, suggests a GPU and serves it on the same API. ${ARCHITECTURES.length} architectures are supported, and you can upload inference code for new ones.`}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              go()
            }}
            className="max-w-md"
          >
            <Segmented
              value={source}
              onChange={setSource}
              options={[
                { id: 'huggingface', label: 'Hugging Face' },
                { id: 'modelscope', label: 'ModelScope' },
              ]}
            />
            <div className="mt-3 flex gap-2">
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="Qwen/Qwen3.8-27B"
                aria-label="Repository ID"
                className="h-11 min-w-0 flex-1 rounded-full border border-line2 bg-panel px-4 text-[14px] text-fg placeholder:text-fg3 focus:border-fg/35 focus:outline-none"
              />
              <button type="submit" className={buttonClass('primary', 'lg', 'shrink-0')}>
                Import
              </button>
            </div>
          </form>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-line2 bg-panel">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <OrgAvatar org="liquid" name="Liquid AI" size={28} />
            <div className="min-w-0">
              <div className="truncate font-mono text-[13px] font-medium">LiquidAI/LFM2.5-24B-A2B-GGUF</div>
              <div className="text-[12px] text-fg3">Imported from Hugging Face</div>
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={14} /> Analyzed
            </span>
          </div>
          <dl className="tabular grid grid-cols-3 border-b border-line">
            {[
              ['Architecture', 'Lfm2Moe'],
              ['Parameters', '24B'],
              ['Context', '131K'],
            ].map(([k, v], i) => (
              <div key={k} className={cx('px-5 py-3.5', i > 0 && 'border-l border-line')}>
                <dt className="text-[12px] text-fg3">{k}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="px-5 pb-2 pt-4 text-[12.5px] font-medium text-fg3">Quantized files</div>
          <div className="px-3 pb-3">
            {quants.map(([q, size]) => {
              const on = q === 'Q4_K_M'
              return (
                <div key={q} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px]', on && 'bg-raised')}>
                  <span className={cx('h-4 w-4 shrink-0 rounded-full border', on ? 'border-[5px] border-accent' : 'border-line2')} />
                  <span className="w-20 font-mono">{q}</span>
                  <span className="flex-1 text-fg3">{on ? 'Recommended' : ''}</span>
                  <span className="tabular text-fg2">{size}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5 text-[13.5px]">
            <span className="text-fg2">
              Suggested GPU <span className="font-semibold text-fg">1× L40S</span>
            </span>
            <span className="tabular font-semibold">$1.60 / hr</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Regions                                                             */
/* ------------------------------------------------------------------ */

function Regions() {
  // how many catalog models each region serves
  const served = useMemo(() => {
    const n: Record<string, number> = {}
    for (const m of MODELS) for (const e of endpointsFor(m)) n[e.region] = (n[e.region] ?? 0) + 1
    return n
  }, [])
  return (
    <section className={cx(CONTAINER, SECTION, 'grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16')}>
      <Head title="Regions" sub="Requests go to the nearest healthy region and fail over automatically. Pin a region in settings if you need data residency." />
      <ul className="min-w-0 divide-y divide-line border-y border-line text-[14px]">
        {REGIONS.map((r) => (
          <li key={r.region} className="flex items-center gap-4 py-3">
            <span className="w-28 shrink-0 font-medium">{r.location}</span>
            <span className="flex-1 font-mono text-[12.5px] text-fg3">{r.region}</span>
            <span className="tabular text-fg2">{served[r.region] ?? 0} models</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
