import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { MODELS, endpointsFor, weeklyTokens } from '../data/models'
import type { Capability } from '../data/types'
import { OrgAvatar } from '../components/ModelBits'
import { Card, PageHeader, Segmented } from '../components/ui'
import { fmtPrice, fmtTokens } from '../lib/format'
import { rng } from '../lib/rand'

const COLORS = ['#3b63fb', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#64748b', '#ef4444']

type Cat = 'all' | Capability

export default function Rankings() {
  const [cat, setCat] = useState<Cat>('all')
  const list = useMemo(() => MODELS.filter((m) => cat === 'all' || m.capabilities.includes(cat as Capability)).sort((a, b) => weeklyTokens(b) - weeklyTokens(a)), [cat])
  const top = list.slice(0, 8)
  const max = weeklyTokens(list[0] ?? MODELS[0])

  const chart = useMemo(() => {
    return Array.from({ length: 12 }, (_, w) => {
      const row: Record<string, number | string> = { week: `W${w + 1}` }
      top.forEach((m) => {
        const r = rng(m.slug + w)
        const born = new Date(m.released).getTime()
        const weekTs = Date.now() - (11 - w) * 7 * 86400_000
        const ramp = weekTs < born ? 0 : Math.min(1, (weekTs - born) / (21 * 86400_000))
        row[m.slug] = Math.round(weeklyTokens(m) * ramp * (0.7 + (w / 11) * 0.35) * (0.9 + r() * 0.2))
      })
      return row
    })
  }, [top])

  const orgs = useMemo(() => {
    const m = new Map<string, { name: string; t: number }>()
    MODELS.forEach((x) => m.set(x.org, { name: x.orgName, t: (m.get(x.org)?.t ?? 0) + weeklyTokens(x) }))
    const total = [...m.values()].reduce((a, b) => a + b.t, 0)
    return [...m.entries()].map(([id, v]) => ({ id, ...v, share: v.t / total })).sort((a, b) => b.t - a.t).slice(0, 8)
  }, [])

  const fastest = useMemo(() => MODELS.map((m) => ({ m, tps: Math.max(...endpointsFor(m).map((e) => e.throughput)) })).sort((a, b) => b.tps - a.tps).slice(0, 6), [])

  return (
    <div>
      <PageHeader title="랭킹" description="InferStack 전체 트래픽 기준 모델 사용량 순위 (주간 토큰)" />
      <Segmented
        value={cat}
        onChange={setCat}
        options={[
          { id: 'all', label: '전체' },
          { id: 'coding', label: '코딩' },
          { id: 'reasoning', label: '추론' },
          { id: 'agent', label: '에이전트' },
          { id: 'vision', label: '비전' },
          { id: 'multilingual', label: '다국어' },
        ]}
      />

      <Card className="mt-4 p-5">
        <div className="mb-2 text-sm font-semibold">최근 12주 토큰 사용량 (상위 8개)</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => fmtTokens(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v: number, n: string) => [fmtTokens(v), MODELS.find((m) => m.slug === n)?.name ?? n]}
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }}
              />
              {top.map((m, i) => (
                <Area key={m.slug} type="monotone" dataKey={m.slug} stackId="1" stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.55} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <Card className="divide-y divide-slate-100 dark:divide-white/5">
          {list.map((m, i) => {
            const delta = (rng(m.slug + 'd')() - 0.35) * 60
            return (
              <Link key={m.slug} to={`/models/${m.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <span className="w-6 text-right text-sm font-semibold text-slate-400">{i + 1}</span>
                <OrgAvatar org={m.org} name={m.orgName} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${(weeklyTokens(m) / max) * 100}%` }} />
                  </div>
                </div>
                <div className="w-20 text-right text-sm font-medium">{fmtTokens(weeklyTokens(m))}</div>
                <div className={`flex w-16 items-center justify-end gap-0.5 text-xs ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(delta).toFixed(0)}%
                </div>
              </Link>
            )
          })}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-sm font-semibold">제공자별 점유율</div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full">
              {orgs.map((o, i) => (
                <div key={o.id} style={{ width: `${o.share * 100}%`, background: COLORS[i % COLORS.length] }} title={o.name} />
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {orgs.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="flex-1">{o.name}</span>
                  <span className="text-slate-500">{(o.share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-semibold">가장 빠른 모델 (tok/s)</div>
            <div className="mt-3 space-y-2 text-sm">
              {fastest.map(({ m, tps }) => (
                <Link key={m.slug} to={`/models/${m.slug}`} className="flex items-center justify-between hover:text-brand-500">
                  <span className="truncate">{m.name}</span>
                  <span className="font-mono text-xs text-slate-500">{tps}</span>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-semibold">가성비 (출력 $/M 낮은순)</div>
            <div className="mt-3 space-y-2 text-sm">
              {[...MODELS]
                .sort((a, b) => a.price.output - b.price.output)
                .slice(0, 6)
                .map((m) => (
                  <Link key={m.slug} to={`/models/${m.slug}`} className="flex items-center justify-between hover:text-brand-500">
                    <span className="truncate">{m.name}</span>
                    <span className="font-mono text-xs text-slate-500">{fmtPrice(m.price.output)}</span>
                  </Link>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
