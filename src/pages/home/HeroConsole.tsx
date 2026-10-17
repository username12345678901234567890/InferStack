import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { endpointsFor, findModel } from '../../data/models'
import { OrgAvatar } from '../../components/ModelBits'
import { CopyButton, cx, highlight } from '../../components/ui'

const PICKS = ['deepseek/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'qwen/qwen3.8-27b', 'moonshotai/kimi-k3']
const SAMPLE = '오픈 웨이트 모델은 가중치가 공개되어 있어 직접 배포하거나 파인튜닝할 수 있습니다. InferStack은 같은 API로 둘 다 서빙합니다.'

type Mode = 'call' | 'upload'
type Lang = 'python' | 'ts' | 'curl'

function callCode(lang: Lang, slug: string) {
  if (lang === 'python')
    return `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.inferstack.dev/v1",
    api_key=os.environ["INFERSTACK_API_KEY"],
)

stream = client.chat.completions.create(
    model="${slug}",
    messages=[{"role": "user", "content": "오픈 웨이트 모델이 뭐야?"}],
    stream=True,
)`
  if (lang === 'ts')
    return `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.inferstack.dev/v1",
  apiKey: process.env.INFERSTACK_API_KEY,
})

const stream = await client.chat.completions.create({
  model: "${slug}",
  messages: [{ role: "user", content: "오픈 웨이트 모델이 뭐야?" }],
  stream: true,
})`
  return `curl https://api.inferstack.dev/v1/chat/completions \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${slug}",
    "messages": [{"role": "user", "content": "오픈 웨이트 모델이 뭐야?"}],
    "stream": true
  }'`
}

const UPLOAD_CODE = `# 로컬 GGUF를 올리면 엔드포인트가 생깁니다
pip install inferstack-cli
inferstack models create lfm-ft --format gguf
inferstack upload ./lfm-ft-Q4_K_M.gguf --model lfm-ft

# 끝나면 카탈로그 모델과 똑같이 호출합니다
#   model="demo/lfm-ft"`

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function HeroConsole() {
  const [mode, setMode] = useState<Mode>('call')
  const [lang, setLang] = useState<Lang>('python')
  const [slug, setSlug] = useState(PICKS[0])
  const code = mode === 'call' ? callCode(lang, slug) : UPLOAD_CODE
  const shLang = mode === 'upload' || lang === 'curl' ? 'bash' : lang

  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d0f] text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.55)]">
      {/* tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-2 py-2">
        <div className="flex gap-0.5">
          {(
            [
              ['call', 'API 호출'],
              ['upload', '모델 업로드'],
            ] as [Mode, string][]
          ).map(([id, l]) => (
            <button key={id} onClick={() => setMode(id)} className={cx('rounded-md px-2.5 py-1 text-[12.5px] transition-colors', mode === id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80')}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          {mode === 'call' &&
            (
              [
                ['python', 'Python'],
                ['ts', 'TypeScript'],
                ['curl', 'cURL'],
              ] as [Lang, string][]
            ).map(([id, l]) => (
              <button key={id} onClick={() => setLang(id)} className={cx('rounded-md px-2 py-1 text-[12px] transition-colors', lang === id ? 'text-white' : 'text-white/40 hover:text-white/75')}>
                {l}
              </button>
            ))}
          <CopyButton text={code} className="ml-1 text-white/40 hover:bg-white/10 hover:text-white" />
        </div>
      </div>

      {/* code */}
      <pre className="h-[326px] overflow-auto py-4 font-mono text-[12.5px] leading-[1.8]">
        <code className="block min-w-max">
          {code.split('\n').map((l, i) => (
            <span key={mode + lang + i + (l.includes(slug) ? slug : '')} className={cx('flex', l.includes(slug) && mode === 'call' && 'animate-fade-in bg-[#ff6a1a]/[0.08]')}>
              <span className="w-10 shrink-0 select-none pr-4 text-right text-white/20">{i + 1}</span>
              <span className="pr-6">{highlight(l, shLang)}</span>
            </span>
          ))}
        </code>
      </pre>

      {mode === 'call' ? <StreamStrip slug={slug} /> : <UploadStrip />}

      {/* model picker */}
      {mode === 'call' && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.07] px-3 py-2.5">
          <span className="mr-1 shrink-0 text-[11.5px] text-white/35">모델</span>
          {PICKS.map((s) => {
            const m = findModel(s)!
            return (
              <button
                key={s}
                onClick={() => setSlug(s)}
                className={cx(
                  'flex shrink-0 items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[12px] transition-colors',
                  slug === s ? 'border-white/25 bg-white/10 text-white' : 'border-white/[0.08] text-white/50 hover:text-white/85',
                )}
              >
                <OrgAvatar org={m.org} name={m.orgName} size={18} className="!rounded-full" />
                {m.name.replace(/ \(.+\)$/, '')}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StreamStrip({ slug }: { slug: string }) {
  const m = findModel(slug)!
  const ep = useMemo(() => endpointsFor(m)[0], [m])
  const [n, setN] = useState(0)
  useEffect(() => {
    if (reduced()) {
      setN(SAMPLE.length)
      return
    }
    setN(0)
    let i = 0
    let t: number
    const start = window.setTimeout(function tick() {
      i += 2
      setN(i)
      if (i < SAMPLE.length) t = window.setTimeout(tick, 1000 / Math.min(ep.throughput, 90))
    }, ep.latency)
    return () => {
      clearTimeout(start)
      clearTimeout(t)
    }
  }, [slug, ep])
  const done = n >= SAMPLE.length
  return (
    <div className="border-t border-white/[0.07] px-4 py-3">
      <div className="flex items-center justify-between font-mono text-[11px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className={cx('h-1.5 w-1.5 rounded-full', done ? 'bg-emerald-400' : 'bg-[#ff6a1a]')} />
          {done ? '200 · stop' : n === 0 ? 'waiting' : 'streaming'}
        </span>
        <span className="tabular">
          {ep.region} · TTFT {(ep.latency / 1000).toFixed(2)}s · {ep.throughput} tok/s
        </span>
      </div>
      <p className="mt-1.5 min-h-[40px] text-[13px] leading-relaxed text-white/85">
        {SAMPLE.slice(0, n)}
        {!done && <span className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] animate-blink bg-[#ff6a1a]" />}
      </p>
    </div>
  )
}

const STAGES = [
  { label: '가중치 업로드', meta: '14.5 GB · Q4_K_M' },
  { label: '런타임 빌드', meta: 'llama.cpp · Lfm2MoeForCausalLM' },
  { label: '엔드포인트', meta: '1× L40S · ap-seoul-1' },
]

function UploadStrip() {
  const [p, setP] = useState(() => (reduced() ? 3 : 0))
  useEffect(() => {
    if (reduced()) return
    const t = setInterval(() => setP((x) => (x >= 3.9 ? 0 : x + 0.025)), 40)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-2 border-t border-white/[0.07] px-4 py-3.5">
      {STAGES.map((s, i) => {
        const v = Math.max(0, Math.min(1, p - i))
        return (
          <div key={s.label} className="grid grid-cols-[16px_92px_1fr_auto] items-center gap-2.5 text-[12px]">
            <span className={cx('flex h-4 w-4 items-center justify-center rounded-full border', v >= 1 ? 'border-emerald-400/60 text-emerald-400' : 'border-white/20')}>{v >= 1 && <Check size={10} strokeWidth={3} />}</span>
            <span className={v > 0 ? 'text-white/85' : 'text-white/35'}>{s.label}</span>
            <span className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <span className={cx('block h-full origin-left rounded-full', v >= 1 ? 'bg-white/45' : 'bg-[#ff6a1a]')} style={{ transform: `scaleX(${v})` }} />
            </span>
            <span className="tabular font-mono text-[11px] text-white/35">{s.meta}</span>
          </div>
        )
      })}
      <div className="flex items-center gap-1.5 pt-1 font-mono text-[11px]">
        <span className={cx('h-1.5 w-1.5 rounded-full', p >= 3 ? 'bg-emerald-400' : 'bg-white/20')} />
        <span className={p >= 3 ? 'text-emerald-400' : 'text-white/35'}>{p >= 3 ? 'live · demo/lfm-ft' : 'deploying…'}</span>
      </div>
    </div>
  )
}
