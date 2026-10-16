import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Cpu, ExternalLink, MessageSquare, Rocket, Star } from 'lucide-react'
import { CAPABILITY_LABEL, endpointsFor, findModel, regionFlag, weeklyTokens } from '../data/models'
import { findArch } from '../data/architectures'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { Badge, Button, Card, CodeBlock, CopyButton, Empty, Segmented, Tabs, cx } from '../components/ui'
import { fmtCtx, fmtDate, fmtNum, fmtParams, fmtPrice, fmtTokens, timeAgo } from '../lib/format'
import { getModelInfo, hfUrl, type HFModelInfo } from '../lib/hf'
import { rng } from '../lib/rand'
import { useStore } from '../store'

type Tab = 'overview' | 'endpoints' | 'api' | 'activity' | 'hf'

export default function ModelDetail() {
  const { org, name } = useParams()
  const slug = `${org}/${name}`
  const m = findModel(slug)
  const [tab, setTab] = useState<Tab>('overview')
  const fav = useStore((s) => s.favorites.includes(slug))
  const toggleFav = useStore((s) => s.toggleFavorite)

  if (!m)
    return (
      <Empty
        title="모델을 찾을 수 없습니다"
        description={slug}
        action={
          <Link to="/models">
            <Button variant="outline">모델 목록으로</Button>
          </Link>
        }
      />
    )

  const arch = findArch(m.architecture)
  const eps = endpointsFor(m)

  return (
    <div>
      <Link to="/models" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-500">
        <ArrowLeft size={14} /> 모델
      </Link>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <OrgAvatar org={m.org} name={m.orgName} size={52} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
            <ModelFlags m={m} />
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono text-sm text-slate-500">
            {m.slug} <CopyButton text={m.slug} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>by {m.orgName}</span>
            <span>공개 {fmtDate(m.released)}</span>
            <span>{fmtCtx(m.context)} context</span>
            <span>
              {fmtPrice(m.price.input)}/M 입력 · {fmtPrice(m.price.output)}/M 출력
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toggleFav(m.slug)}>
            <Star size={16} className={cx(fav && 'fill-amber-400 text-amber-400')} />
          </Button>
          <Link to={`/deploy/new?source=huggingface&repo=${encodeURIComponent(m.hfId)}`}>
            <Button variant="outline">
              <Rocket size={16} /> 전용 배포
            </Button>
          </Link>
          <Link to={`/chat?model=${encodeURIComponent(m.slug)}`}>
            <Button>
              <MessageSquare size={16} /> 채팅
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['입력', `${fmtPrice(m.price.input)}/M`],
          ['출력', `${fmtPrice(m.price.output)}/M`],
          ['캐시 입력', `${fmtPrice(m.price.cachedInput ?? 0)}/M`],
          ['컨텍스트', fmtCtx(m.context)],
          ['파라미터', `${fmtParams(m.params)}${m.activeParams ? ` (${fmtParams(m.activeParams)} 활성)` : ''}`],
        ].map(([l, v]) => (
          <Card key={l} className="p-3">
            <div className="text-xs text-slate-500">{l}</div>
            <div className="mt-1 font-semibold">{v}</div>
          </Card>
        ))}
      </div>

      <Tabs
        className="mt-8"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: '개요' },
          { id: 'endpoints', label: `엔드포인트 (${eps.length})` },
          { id: 'api', label: 'API' },
          { id: 'activity', label: '사용량' },
          { id: 'hf', label: '🤗 Hugging Face' },
        ]}
      />

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">{m.description}</p>
              <div>
                <div className="mb-2 text-sm font-semibold">기능</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.capabilities.map((c) => (
                    <Badge key={c} color="brand">
                      {CAPABILITY_LABEL[c]}
                    </Badge>
                  ))}
                  {m.input.map((i) => (
                    <Badge key={i}>입력: {i}</Badge>
                  ))}
                </div>
              </div>
              <UsageChart slug={m.slug} weekly={weeklyTokens(m)} />
            </div>
            <Card className="h-fit p-5 text-sm">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Cpu size={16} /> 아키텍처
              </div>
              <dl className="space-y-2">
                <Row k="architectures" v={<span className="font-mono text-xs">{m.architecture}</span>} />
                <Row k="계열" v={arch?.family ?? '—'} />
                <Row k="model_type" v={<span className="font-mono text-xs">{arch?.modelType ?? '—'}</span>} />
                <Row k="MoE" v={arch?.moe || m.activeParams ? '예' : '아니오'} />
                <Row k="엔진" v={arch?.engines.join(', ') ?? '—'} />
                <Row k="포맷" v={arch?.formats.join(', ') ?? '—'} />
                <Row k="라이선스" v={m.license} />
                <Row
                  k="원본"
                  v={
                    <a href={hfUrl(m.hfId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-500 hover:underline">
                      {m.hfId} <ExternalLink size={11} />
                    </a>
                  }
                />
              </dl>
            </Card>
          </div>
        )}

        {tab === 'endpoints' && (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="px-4 py-3 font-medium">리전</th>
                  <th className="px-3 py-3 font-medium">GPU</th>
                  <th className="px-3 py-3 font-medium">양자화</th>
                  <th className="px-3 py-3 text-right font-medium">입력</th>
                  <th className="px-3 py-3 text-right font-medium">출력</th>
                  <th className="px-3 py-3 text-right font-medium">처리량</th>
                  <th className="px-3 py-3 text-right font-medium">TTFT</th>
                  <th className="px-3 py-3 text-right font-medium">가동률</th>
                  <th className="px-3 py-3 text-right font-medium">최대 출력</th>
                </tr>
              </thead>
              <tbody>
                {eps.map((e, i) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{regionFlag(e.region)}</span>
                        <div>
                          <div className="font-medium">{e.location}</div>
                          <div className="font-mono text-[11px] text-slate-500">{e.region}</div>
                        </div>
                        {i === 0 && <Badge color="green">기본</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3">{e.gpu}</td>
                    <td className="px-3 py-3">
                      <Badge>{e.quant}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{fmtPrice(m.price.input * e.priceMul)}</td>
                    <td className="px-3 py-3 text-right font-mono">{fmtPrice(m.price.output * e.priceMul)}</td>
                    <td className="px-3 py-3 text-right">{e.throughput} tok/s</td>
                    <td className="px-3 py-3 text-right">{e.latency}ms</td>
                    <td className="px-3 py-3 text-right">
                      <span className={e.uptime > 99.7 ? 'text-emerald-500' : 'text-amber-500'}>{e.uptime}%</span>
                    </td>
                    <td className="px-3 py-3 text-right">{fmtCtx(e.maxOutput)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/10">
              요청은 기본적으로 가격·지연·가동률을 종합해 자동 라우팅됩니다. <code className="font-mono">provider.order</code> 파라미터로 리전을 고정할 수 있습니다.
            </div>
          </Card>
        )}

        {tab === 'api' && <ApiSamples slug={m.slug} />}
        {tab === 'activity' && <UsageChart slug={m.slug} weekly={weeklyTokens(m)} big />}
        {tab === 'hf' && <HFPanel repo={m.hfId} />}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  )
}

function UsageChart({ slug, weekly, big }: { slug: string; weekly: number; big?: boolean }) {
  const data = useMemo(() => {
    const r = rng(slug + ':usage')
    const daily = weekly / 7
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400_000)
      const growth = 0.55 + (i / 29) * 0.6
      return { day: `${d.getMonth() + 1}/${d.getDate()}`, tokens: Math.round(daily * growth * (0.8 + r() * 0.4)) }
    })
  }, [slug, weekly])
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold">일별 토큰 사용량 (30일)</div>
          <div className="text-xs text-slate-500">주간 {fmtTokens(weekly)} 토큰</div>
        </div>
      </div>
      <div className={big ? 'h-80' : 'h-48'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3b63fb" stopOpacity={0.45} />
                <stop offset="1" stopColor="#3b63fb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tickFormatter={(v) => fmtTokens(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={48} />
            <Tooltip formatter={(v: number) => [fmtTokens(v), '토큰']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="tokens" stroke="#3b63fb" strokeWidth={2} fill="url(#ug)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
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
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "안녕하세요!"},
    ],
    stream=True,
    extra_body={
        "provider": {"order": ["ap-seoul-1"], "allow_fallbacks": True},
    },
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
    "messages": [{"role": "user", "content": "안녕하세요!"}],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`,
  }
  return (
    <div className="max-w-3xl">
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
      <CodeBlock code={code[lang]} lang={lang === 'curl' ? 'bash' : lang} />
      <p className="mt-3 text-sm text-slate-500">
        API 키가 없다면{' '}
        <Link to="/keys" className="text-brand-500 hover:underline">
          API 키 페이지
        </Link>
        에서 발급하세요.
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
  if (err) return <Card className="p-6 text-sm text-slate-500">Hugging Face 정보를 불러오지 못했습니다: {err}</Card>
  if (!info) return <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
  const st = info.files.filter((f) => f.path.endsWith('.safetensors'))
  const total = info.files.reduce((s, f) => s + (f.size ?? 0), 0)
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-5 md:col-span-2">
        <div className="flex items-center justify-between">
          <a href={hfUrl(repo)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono text-sm font-medium hover:text-brand-500">
            {repo} <ExternalLink size={12} />
          </a>
          <Badge color="green">실시간</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['좋아요', fmtNum(info.likes)],
            ['다운로드(30일)', fmtTokens(info.downloads)],
            ['파일', `${info.files.length}개`],
            ['저장소 크기', `${(total / 1e9).toFixed(1)} GB`],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-xs text-slate-500">{l}</div>
              <div className="font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {info.tags.slice(0, 14).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </Card>
      <Card className="p-5 text-sm">
        <dl className="space-y-2">
          <Row k="architecture" v={<span className="font-mono text-xs">{info.architecture ?? '—'}</span>} />
          <Row k="model_type" v={<span className="font-mono text-xs">{info.modelType ?? '—'}</span>} />
          <Row k="max_position" v={info.contextLength ? fmtNum(info.contextLength) : '—'} />
          <Row k="safetensors" v={`${st.length} shards`} />
          <Row k="라이브러리" v={info.library_name ?? '—'} />
          <Row k="수정일" v={info.lastModified ? timeAgo(info.lastModified) : '—'} />
        </dl>
      </Card>
    </div>
  )
}
