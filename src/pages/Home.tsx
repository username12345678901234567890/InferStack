import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, MessageSquare } from 'lucide-react'
import { MODELS, ORGS, REGIONS, endpointsFor, findModel, weeklyTokens } from '../data/models'
import { ARCHITECTURES } from '../data/architectures'
import type { CatalogModel } from '../data/types'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { LogoMark } from '../components/Logo'
import { ButtonLink, CopyButton, Segmented, buttonClass, cx, highlight } from '../components/ui'
import { CONTAINER } from '../components/Layout'
import { FallbackArt, LogosArt, MetricsArt, UploadArt } from './home/Illustrations'
import { fmtCtx, fmtPrice, fmtTokens, fmtUSD } from '../lib/format'

export default function Home() {
  return (
    <div>
      <Hero />
      <Pulse />
      <Showcase />
      <Features />
      <Start />
      <Upload />
      <Global />
      <Closing />
    </div>
  )
}

const SECTION = 'py-16 sm:py-24'

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
function Head({ eyebrow, title, sub, action }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <div className="mb-3 text-[13px] font-medium text-accent">{eyebrow}</div>}
        <h2 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[36px]">{title}</h2>
        {sub && <p className="mt-3 text-[16px] leading-relaxed text-fg2">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const newest = [...MODELS].sort((a, b) => b.released.localeCompare(a.released))[0]
  return (
    <section className={cx(CONTAINER, 'grid grid-cols-1 items-center gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-14')}>
      <div>
        <Link to={`/models/${newest.slug}`} className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3 text-[13px] text-fg2 transition-colors hover:border-line2 hover:text-fg">
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[12px] font-medium text-accent">New</span>
          {newest.name} is live
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
        <h1 className="mt-6 text-[42px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[60px]">
          One API for
          <br />
          every open model
        </h1>
        <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-fg2 sm:text-[18px]">
          Call {MODELS.length} open-weight models from DeepSeek, Qwen, Kimi, GLM and {ORGS.length - 4} more labs — or deploy your own fine-tune to the same endpoint. OpenAI-compatible, pay per token.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink to="/keys" size="xl" className="w-full sm:w-auto">
            Get your API key <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink to="/chat" size="xl" variant="outline" className="w-full sm:w-auto">
            Try it in chat
          </ButtonLink>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-fg3">
          {['$5 free credit', 'No card required', 'Works with the OpenAI SDK'].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check size={14} className="text-fg2" /> {t}
            </li>
          ))}
        </ul>
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
    prompt: 'Three ways to cut LLM serving costs?',
    answer:
      '1. Quantize weights to FP8 or 4-bit.\n2. Batch requests continuously to keep GPUs busy.\n3. Send easy prompts to a smaller model.',
    code: false,
  },
  {
    model: 'moonshotai/kimi-k3',
    prompt: 'A haiku about open weights.',
    answer: 'Weights laid in the open —\nanyone may lift the stone\nand hear the river.',
    code: false,
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
/* Live numbers + model ticker                                         */
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
      <Ticker />
    </section>
  )
}

function Ticker() {
  const list = useMemo(() => [...MODELS].sort((a, b) => weeklyTokens(b) - weeklyTokens(a)), [])
  return (
    <div className="group relative overflow-hidden border-t border-line py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="flex w-max animate-marquee gap-2.5 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[...list, ...list].map((m, i) => (
          <Link
            key={m.slug + i}
            to={`/models/${m.slug}`}
            aria-hidden={i >= list.length}
            tabIndex={i >= list.length ? -1 : 0}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-panel py-1.5 pl-1.5 pr-3.5 text-[13px] transition-colors hover:border-line2"
          >
            <OrgAvatar org={m.org} name={m.orgName} size={20} className="!rounded-full" />
            <span className="font-medium">{m.name}</span>
            <span className="tabular text-fg3">{fmtPrice(m.price.output)}/M</span>
          </Link>
        ))}
      </div>
    </div>
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
        title="Every major open model, one endpoint"
        sub="New releases land the day they ship. Same request format, same key, priced per token."
        action={
          <ButtonLink to="/models" variant="outline">
            Browse all {MODELS.length} models <ArrowRight size={15} />
          </ButtonLink>
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
/* Why InferStack                                                      */
/* ------------------------------------------------------------------ */

function Features() {
  const items = [
    { art: <LogosArt />, title: 'Every lab, one format', desc: `Models from ${ORGS.length} labs behind the same OpenAI-compatible request. Switch models by changing one string.`, link: ['Browse models', '/models'] },
    { art: <FallbackArt />, title: 'Fails over, keeps answering', desc: 'If a region stops responding, the request moves to another region serving the same model.', link: ['How routing works', '/docs#routing'] },
    { art: <MetricsArt />, title: 'Prices and speed in the open', desc: 'Token price, throughput and latency are published for every endpoint. Compare with numbers.', link: ['See rankings', '/rankings'] },
    { art: <UploadArt />, title: 'Your models, same API', desc: 'Import weights from Hugging Face, ModelScope or the CLI and get a dedicated endpoint.', link: ['Deploy a model', '/deploy'] },
  ]
  return (
    <section className="bg-raised/50">
      <div className={cx(CONTAINER, SECTION)}>
        <Head title="Built for production traffic" sub="The unglamorous parts of serving open models — routing, failover, metering — handled for you." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <Link key={it.title} to={it.link[1]} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-line2">
              <div className="flex h-[184px] items-center justify-center border-b border-line px-6">{it.art}</div>
              <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <h3 className="text-[15.5px] font-semibold tracking-[-0.01em]">{it.title}</h3>
                <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-fg2">{it.desc}</p>
                <span className="mt-4 flex items-center gap-1 text-[13.5px] font-medium text-fg2 transition-colors group-hover:text-fg">
                  {it.link[0]} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
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
    { title: 'Create an account', desc: 'Sign in with GitHub or Google. You get $5 of credit to try any model.', to: '/signin', cta: 'Sign up' },
    { title: 'Create an API key', desc: 'Set a spend limit, an expiry date or allowed models per key.', to: '/keys', cta: 'Create a key' },
    { title: 'Change your base URL', desc: 'Point any OpenAI client at InferStack. The rest of your code stays the same.', to: '/docs#quickstart', cta: 'Read the quickstart' },
  ]
  const s = SNIPPETS[lang]
  return (
    <section className={cx(CONTAINER, SECTION, 'grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16')}>
      <div>
        <Head title="Your first call in three steps" sub="If your code already talks to OpenAI, you are one line away." />
        <ol className="space-y-1">
          {steps.map((st, i) => (
            <li key={st.title} className="-mx-3 flex gap-4 rounded-2xl p-3">
              <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line2 text-[13px] font-semibold">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{st.title}</h3>
                <p className="mt-1 text-[14.5px] leading-relaxed text-fg2">{st.desc}</p>
                <Link to={st.to} className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-medium text-accent hover:underline hover:underline-offset-4">
                  {st.cta} <ArrowRight size={13} />
                </Link>
              </div>
            </li>
          ))}
        </ol>
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
            eyebrow="Bring your own model"
            title="Your fine-tune, live in minutes"
            sub="Paste a repo ID. We read the architecture and quantized files, pick the GPU and give you an endpoint. New architecture? Upload your inference code with it."
          />
          <ul className="-mt-2 space-y-2.5 text-[14.5px]">
            {['Hugging Face, ModelScope or CLI upload', 'GGUF and safetensors, optional FP8 at deploy', `${ARCHITECTURES.length} architectures detected automatically`, 'Keep it private, or publish and earn 80% of revenue'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check size={15} className="shrink-0 text-fg3" /> {t}
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              go()
            }}
            className="mt-8 max-w-md"
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
/* Global                                                              */
/* ------------------------------------------------------------------ */

function Global() {
  const reduce = useReducedMotion()
  const base = useMemo(() => REGIONS.map((_, i) => 38 + ((i * 47) % 120)), [])
  const [lat, setLat] = useState(base)
  const seed = useRef(7)
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => {
      setLat(
        base.map((b) => {
          seed.current = (seed.current * 9301 + 49297) % 233280
          return Math.round(b * (0.92 + (seed.current / 233280) * 0.16))
        }),
      )
    }, 2000)
    return () => window.clearInterval(t)
  }, [base, reduce])

  return (
    <section className={cx(CONTAINER, SECTION, 'grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16')}>
      <div>
        <Head
          eyebrow="Global by default"
          title="Close to your users, wherever they are"
          sub={`Requests go to the nearest healthy region across ${REGIONS.length} locations on four continents, and fail over automatically when one slows down.`}
        />
        <ul className="-mt-2 space-y-2.5 text-[14.5px]">
          {['Pay in USD with any major card', 'Monthly invoices for teams', 'Prompts are never logged unless you opt in', 'Pin a region when data residency matters'].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <Check size={15} className="shrink-0 text-fg3" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="text-[14px] font-semibold">Edge latency</span>
          <span className="flex items-center gap-1.5 text-[12.5px] text-fg3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All regions operational
          </span>
        </div>
        <ul>
          {REGIONS.map((r, i) => (
            <li key={r.region} className="flex items-center gap-4 border-b border-line px-5 py-3 text-[14px] last:border-0">
              <span className="w-24 shrink-0 font-medium">{r.location}</span>
              <span className="hidden w-32 shrink-0 font-mono text-[12.5px] text-fg3 sm:block">{r.region}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                <span className="block h-full rounded-full bg-brand-x transition-[width] duration-700" style={{ width: `${Math.min(100, (lat[i] / 180) * 100)}%` }} />
              </span>
              <span className="tabular w-14 shrink-0 text-right text-fg2">{lat[i]} ms</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Closing                                                             */
/* ------------------------------------------------------------------ */

function Closing() {
  return (
    <section className={cx(CONTAINER, 'pb-24')}>
      <div className="relative overflow-hidden rounded-3xl bg-[#14164a] px-8 py-14 text-white ring-1 ring-inset ring-white/10 sm:px-14">
        <LogoMark size={176} className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 lg:block" />
        <div className="relative max-w-xl">
          <h2 className="text-[32px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[40px]">Start building in minutes</h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-white/65">Get $5 of free credit and call any of {MODELS.length} models with the OpenAI client you already use.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/keys" className={buttonClass('primary', 'xl')}>
              Get your API key <ArrowRight size={16} />
            </Link>
            <Link to="/docs" className={buttonClass('outline', 'xl', '!border-white/20 !text-white hover:!bg-white/10')}>
              Read the docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
