import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ExternalLink, MessageSquare, Rocket, Star } from 'lucide-react'
import { CAPABILITY_LABEL, endpointsFor, findModel, weeklyTokens } from '../data/models'
import { findArch } from '../data/architectures'
import type { CatalogModel, Endpoint } from '../data/types'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { Badge, ButtonLink, CodeBlock, CopyButton, Empty, Segmented, Tabs, cx, tbl } from '../components/ui'
import { fmtCtx, fmtDate, fmtNum, fmtParams, fmtPrice, fmtTokens, timeAgo } from '../lib/format'
import { getModelInfo, hfUrl, type HFModelInfo } from '../lib/hf'
import { rng } from '../lib/rand'
import { useStore } from '../store'

type Tab = 'overview' | 'endpoints' | 'api' | 'hf'

const REGION_KO: Record<string, string> = { 'ap-seoul-1': '서울', 'ap-tokyo-1': '도쿄', 'us-east-1': '버지니아', 'us-west-2': '오리건', 'eu-central-1': '프랑크푸르트' }

export default function ModelDetail() {
  const { org, name } = useParams()
  const slug = `${org}/${name}`
  const m = findModel(slug)
  const [tab, setTab] = useState<Tab>('overview')
  const fav = useStore((s) => s.favorites.includes(slug))
  const toggleFav = useStore((s) => s.toggleFavorite)

  if (!m) return <Empty title="모델을 찾을 수 없습니다" description={slug} action={<ButtonLink to="/models" variant="outline">모델 목록으로</ButtonLink>} />

  const eps = endpointsFor(m)

  return (
    <div>
      <nav className="mb-6 flex items-center gap-1.5 text-[13.5px] text-fg3">
        <Link to="/models" className="hover:text-fg">
          모델
        </Link>
        <span>/</span>
        <Link to={`/models?q=${encodeURIComponent(m.orgName)}`} className="hover:text-fg">
          {m.orgName}
        </Link>
      </nav>

      {/* header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <OrgAvatar org={m.org} name={m.orgName} size={52} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em]">{m.name}</h1>
              <ModelFlags m={m} />
            </div>
            <div className="mt-1 flex items-center gap-1 font-mono text-[13.5px] text-fg2">
              {m.slug}
              <CopyButton text={m.slug} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => toggleFav(m.slug)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line2 text-fg2 hover:bg-raised hover:text-fg" aria-label="즐겨찾기" title="즐겨찾기">
            <Star size={16} className={cx(fav && 'fill-accent text-accent')} />
          </button>
          <ButtonLink to={`/deploy/new?source=huggingface&repo=${encodeURIComponent(m.hfId)}`} variant="outline">
            <Rocket size={15} /> 전용 배포
          </ButtonLink>
          <ButtonLink to={`/chat?model=${encodeURIComponent(m.slug)}`}>
            <MessageSquare size={15} /> 채팅
          </ButtonLink>
        </div>
      </div>

      {/* key numbers */}
      <dl className="tabular mt-8 grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-panel sm:grid-cols-3 lg:grid-cols-6">
        {[
          ['입력', `${fmtPrice(m.price.input)}`, '/ 1M 토큰'],
          ['출력', `${fmtPrice(m.price.output)}`, '/ 1M 토큰'],
          ['캐시 입력', `${fmtPrice(m.price.cachedInput ?? 0)}`, '/ 1M 토큰'],
          ['컨텍스트', fmtCtx(m.context), `${fmtNum(m.context)} 토큰`],
          ['파라미터', fmtParams(m.params), m.activeParams ? `활성 ${fmtParams(m.activeParams)}` : findArch(m.architecture)?.moe ? 'MoE · 활성 비공개' : '덴스'],
          ['공개일', fmtDate(m.released), `라이선스 ${m.license}`],
        ].map(([k, v, sub], i) => (
          <div key={k} className={cx('px-5 py-4', i > 0 && 'border-l border-line', i >= 2 && 'max-lg:border-t', i % 2 === 0 && 'max-sm:border-l-0')}>
            <dt className="text-[12.5px] text-fg3">{k}</dt>
            <dd className="mt-1 text-[18px] font-semibold tracking-[-0.01em]">{v}</dd>
            <dd className="mt-0.5 truncate text-[12px] text-fg3">{sub}</dd>
          </div>
        ))}
      </dl>

      <Tabs
        className="mt-10"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: '개요' },
          { id: 'endpoints', label: `엔드포인트 ${eps.length}` },
          { id: 'api', label: 'API' },
          { id: 'hf', label: 'Hugging Face' },
        ]}
      />

      <div className="mt-8">
        {tab === 'overview' && <Overview m={m} eps={eps} />}
        {tab === 'endpoints' && <EndpointTable m={m} eps={eps} />}
        {tab === 'api' && <ApiSamples slug={m.slug} />}
        {tab === 'hf' && <HFPanel repo={m.hfId} />}
      </div>
    </div>
  )
}

function Overview({ m, eps }: { m: CatalogModel; eps: Endpoint[] }) {
  const arch = findArch(m.architecture)
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-10">
        <p className="max-w-3xl text-[15.5px] leading-[1.75] text-fg2">{m.description}</p>
        <section>
          <h2 className="mb-4 text-[17px] font-semibold">엔드포인트</h2>
          <EndpointTable m={m} eps={eps} compact />
        </section>
        <section>
          <UsageChart m={m} />
        </section>
      </div>
      <aside className="space-y-6">
        <div className="rounded-xl border border-line bg-panel">
          <div className="border-b border-line px-5 py-3.5 text-[14px] font-semibold">스펙</div>
          <dl className="divide-y divide-line text-[13.5px]">
            {[
              ['아키텍처', <span className="break-all font-mono text-[12.5px]">{m.architecture}</span>],
              ['계열', arch?.family ?? '—'],
              ['구조', arch?.moe || m.activeParams ? 'MoE' : '덴스'],
              ['입력 형식', m.input.map((i) => ({ text: '텍스트', image: '이미지', audio: '오디오', video: '영상' })[i]).join(', ')],
              ['엔진', arch?.engines.join(', ') ?? '—'],
              ['라이선스', m.license],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-4 px-5 py-3">
                <dt className="shrink-0 text-fg3">{k}</dt>
                <dd className="min-w-0 text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <a href={hfUrl(m.hfId)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 border-t border-line px-5 py-3 text-[13.5px] text-fg2 hover:text-fg">
            <span className="truncate font-mono text-[12.5px]">{m.hfId}</span>
            <ExternalLink size={14} className="shrink-0" />
          </a>
        </div>
        <div>
          <div className="mb-2.5 text-[13.5px] font-semibold">용도</div>
          <div className="flex flex-wrap gap-1.5">
            {m.capabilities.map((c) => (
              <Badge key={c}>{CAPABILITY_LABEL[c]}</Badge>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function EndpointTable({ m, eps, compact }: { m: CatalogModel; eps: Endpoint[]; compact?: boolean }) {
  return (
    <div>
      <div className={tbl.wrap}>
        <table className={tbl.table}>
          <thead>
            <tr>
              <th className={tbl.th}>리전</th>
              <th className={tbl.th}>GPU · 양자화</th>
              <th className={tbl.thR}>입력 / 1M</th>
              <th className={tbl.thR}>출력 / 1M</th>
              <th className={tbl.thR}>첫 토큰</th>
              <th className={tbl.thR}>처리량</th>
              <th className={tbl.thR}>가동률</th>
              {!compact && <th className={tbl.thR}>최대 출력</th>}
            </tr>
          </thead>
          <tbody>
            {eps.map((e, i) => (
              <tr key={e.id} className={tbl.tr}>
                <td className={tbl.td}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{REGION_KO[e.region] ?? e.region}</span>
                    {i === 0 && <Badge color="brand">기본</Badge>}
                  </div>
                  <div className="font-mono text-[12px] text-fg3">{e.region}</div>
                </td>
                <td className={tbl.td}>
                  {e.gpu} <span className="text-fg3">· {e.quant}</span>
                </td>
                <td className={tbl.tdR}>{fmtPrice(m.price.input * e.priceMul)}</td>
                <td className={tbl.tdR}>{fmtPrice(m.price.output * e.priceMul)}</td>
                <td className={tbl.tdR}>{(e.latency / 1000).toFixed(2)}s</td>
                <td className={tbl.tdR}>{e.throughput} tok/s</td>
                <td className={tbl.tdR}>
                  <span className={e.uptime > 99.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{e.uptime}%</span>
                </td>
                {!compact && <td className={tbl.tdR}>{fmtCtx(e.maxOutput)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-fg3">요청은 가격, 지연, 가동률을 함께 따져 자동으로 라우팅됩니다. 지연·처리량·가동률은 데모용 예시 값입니다.</p>
    </div>
  )
}

function UsageChart({ m }: { m: CatalogModel }) {
  const weekly = weeklyTokens(m)
  const data = useMemo(() => {
    const r = rng(m.slug + ':usage')
    const daily = weekly / 7
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400_000)
      return { day: `${d.getMonth() + 1}/${d.getDate()}`, tokens: Math.round(daily * (0.6 + (i / 29) * 0.5) * (0.85 + r() * 0.3)) }
    })
  }, [m.slug, weekly])
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-[17px] font-semibold">사용량</h2>
        <span className="tabular text-[13.5px] text-fg2">주간 {fmtTokens(weekly)} 토큰</span>
      </div>
      <div className="h-56 rounded-xl border border-line bg-panel p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff6a1a" stopOpacity={0.25} />
                <stop offset="1" stopColor="#ff6a1a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(128,128,140,.12)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8a8d96' }} tickLine={false} axisLine={false} interval={6} />
            <YAxis tickFormatter={(v) => fmtTokens(v)} tick={{ fontSize: 12, fill: '#8a8d96' }} tickLine={false} axisLine={false} width={48} />
            <Tooltip formatter={(v: number) => [fmtTokens(v), '토큰']} contentStyle={{ background: '#16171a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12, color: '#f3f4f6' }} />
            <Area type="monotone" dataKey="tokens" stroke="#ff6a1a" strokeWidth={2} fill="url(#ug)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ApiSamples({ slug }: { slug: string }) {
  const [lang, setLang] = useState<'python' | 'ts' | 'curl'>('python')
  const code = {
    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.inferstack.dev/v1",
    api_key="<INFERSTACK_API_KEY>",
)

stream = client.chat.completions.create(
    model="${slug}",
    messages=[{"role": "user", "content": "안녕하세요!"}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
    ts: `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.inferstack.dev/v1",
  apiKey: process.env.INFERSTACK_API_KEY,
})

const stream = await client.chat.completions.create({
  model: "${slug}",
  messages: [{ role: "user", content: "안녕하세요!" }],
  stream: true,
})
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}`,
    curl: `curl https://api.inferstack.dev/v1/chat/completions \\
  -H "Authorization: Bearer $INFERSTACK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
"model": "${slug}",
"messages": [{"role": "user", "content": "안녕하세요!"}]
  }'`,
  }
  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] text-fg2">OpenAI SDK의 base URL만 바꿔 호출합니다.</span>
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
      <CodeBlock code={code[lang]} lang={lang === 'curl' ? 'bash' : lang} />
      <p className="mt-3 text-[13.5px] text-fg3">
        API 키는{' '}
        <Link to="/keys" className="text-fg underline decoration-fg3 underline-offset-4 hover:decoration-fg">
          API 키 페이지
        </Link>
        에서 만듭니다.
      </p>
    </div>
  )
}

function HFPanel({ repo }: { repo: string }) {
  const [info, setInfo] = useState<HFModelInfo | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    setInfo(null)
    setErr(null)
    getModelInfo(repo)
      .then(setInfo)
      .catch((e) => setErr(String(e.message ?? e)))
  }, [repo])
  if (err) return <div className="rounded-xl border border-line p-6 text-[14px] text-fg2">Hugging Face 정보를 불러오지 못했습니다: {err}</div>
  if (!info) return <div className="h-44 animate-pulse rounded-xl bg-raised" />
  const st = info.files.filter((f) => f.path.endsWith('.safetensors'))
  const total = info.files.reduce((s, f) => s + (f.size ?? 0), 0)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <a href={hfUrl(repo)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-mono text-[14px] font-medium hover:underline">
          {repo} <ExternalLink size={13} />
        </a>
        <span className="flex items-center gap-1.5 text-[12.5px] text-fg3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> huggingface.co에서 실시간으로 불러옴
        </span>
      </div>
      <dl className="tabular grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-panel sm:grid-cols-4">
        {[
          ['좋아요', fmtNum(info.likes)],
          ['다운로드 (30일)', fmtTokens(info.downloads)],
          ['파일', `${info.files.length}개`],
          ['저장소 크기', `${(total / 1e9).toFixed(1)} GB`],
        ].map(([k, v], i) => (
          <div key={k} className={cx('px-5 py-4', i > 0 && 'sm:border-l sm:border-line', i >= 2 && 'max-sm:border-t max-sm:border-line', i % 2 === 1 && 'max-sm:border-l max-sm:border-line')}>
            <dt className="text-[12.5px] text-fg3">{k}</dt>
            <dd className="mt-1 text-[18px] font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className={tbl.wrap}>
        <table className={tbl.table}>
          <tbody>
            {[
              ['architectures', info.architecture ?? '—'],
              ['model_type', info.modelType ?? '—'],
              ['max_position_embeddings', info.contextLength ? fmtNum(info.contextLength) : '—'],
              ['safetensors', `${st.length}개 샤드`],
              ['라이브러리', info.library_name ?? '—'],
              ['마지막 수정', info.lastModified ? timeAgo(info.lastModified) : '—'],
            ].map(([k, v]) => (
              <tr key={k} className={tbl.tr}>
                <td className={cx(tbl.td, 'w-56 font-mono text-[12.5px] text-fg3')}>{k}</td>
                <td className={tbl.td}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {info.tags.slice(0, 16).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
    </div>
  )
}
