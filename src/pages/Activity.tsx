import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Segmented, Select, Stat, cx, tbl } from '../components/ui'
import { useStore } from '../store'
import { fmtDateTime, fmtTokens, fmtUSD } from '../lib/format'
import { findModel } from '../data/models'

const COLORS = ['#ff6a1a', '#7c8aa5', '#4fa3a5', '#c9a66b', '#9b8bb4', '#6b7280']

export default function Activity() {
  const logs = useStore((s) => s.logs)
  const [range, setRange] = useState<'7' | '30'>('30')
  const [metric, setMetric] = useState<'cost' | 'tokens' | 'requests'>('cost')
  const [model, setModel] = useState('all')
  const [key, setKey] = useState('all')
  const [page, setPage] = useState(0)

  const days = +range
  const since = Date.now() - days * 86400_000
  const inRange = useMemo(() => logs.filter((l) => l.ts >= since), [logs, since])
  const filtered = inRange.filter((l) => (model === 'all' || l.model === model) && (key === 'all' || l.keyName === key))

  const topModels = useMemo(() => {
    const m = new Map<string, number>()
    inRange.forEach((l) => m.set(l.model, (m.get(l.model) ?? 0) + l.cost))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k)
  }, [inRange])

  const chart = useMemo(() => {
    const out: Record<string, number | string>[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d0 = new Date()
      d0.setHours(0, 0, 0, 0)
      const start = d0.getTime() - i * 86400_000
      const end = start + 86400_000
      const row: Record<string, number | string> = { day: `${new Date(start).getMonth() + 1}/${new Date(start).getDate()}` }
      for (const l of filtered) {
        if (l.ts < start || l.ts >= end) continue
        const k = topModels.includes(l.model) ? l.model : '기타'
        const v = metric === 'cost' ? l.cost : metric === 'tokens' ? l.promptTokens + l.completionTokens : 1
        row[k] = ((row[k] as number) ?? 0) + v
      }
      out.push(row)
    }
    return out
  }, [filtered, days, topModels, metric])

  const series = [...topModels, '기타']
  const keys = Array.from(new Set(logs.map((l) => l.keyName)))
  const models = Array.from(new Set(logs.map((l) => l.model)))
  const totalCost = filtered.reduce((a, l) => a + l.cost, 0)
  const totalTok = filtered.reduce((a, l) => a + l.promptTokens + l.completionTokens, 0)
  const avgLat = filtered.length ? filtered.reduce((a, l) => a + l.latency, 0) / filtered.length : 0
  const PAGE = 15
  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE)

  const exportCsv = () => {
    const head = 'id,timestamp,model,key,endpoint,prompt_tokens,completion_tokens,cost_usd,latency_ms,tps,finish,source'
    const body = filtered.map((l) => [l.id, new Date(l.ts).toISOString(), l.model, l.keyName, l.endpoint, l.promptTokens, l.completionTokens, l.cost.toFixed(6), l.latency, l.throughput, l.finish, l.source].join(','))
    const url = URL.createObjectURL(new Blob([[head, ...body].join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `inferstack-activity-${range}d.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="활동"
        description="요청 단위 사용량, 비용, 지연시간을 확인합니다."
        actions={
          <>
            <Segmented
              value={range}
              onChange={(v) => {
                setRange(v)
                setPage(0)
              }}
              options={[
                { id: '7', label: '7일' },
                { id: '30', label: '30일' },
              ]}
            />
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={14} /> CSV
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="비용" value={fmtUSD(totalCost)} />
        <Stat label="토큰" value={fmtTokens(totalTok)} />
        <Stat label="요청" value={filtered.length.toLocaleString()} />
        <Stat label="평균 첫 토큰 지연" value={`${Math.round(avgLat)}ms`} />
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            value={metric}
            onChange={setMetric}
            options={[
              { id: 'cost', label: '비용' },
              { id: 'tokens', label: '토큰' },
              { id: 'requests', label: '요청 수' },
            ]}
          />
          <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            <Select value={model} onChange={(e) => (setModel(e.target.value), setPage(0))} className="h-9 min-w-0 flex-1 text-[13px] sm:w-52 sm:flex-none" aria-label="모델 필터">
              <option value="all">모든 모델</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {findModel(m)?.name ?? m}
                </option>
              ))}
            </Select>
            <Select value={key} onChange={(e) => (setKey(e.target.value), setPage(0))} className="h-9 min-w-0 flex-1 text-[13px] sm:w-36 sm:flex-none" aria-label="키 필터">
              <option value="all">모든 키</option>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={days > 7 ? 3 : 0} />
              <YAxis tickFormatter={(v) => (metric === 'cost' ? `$${v.toFixed(2)}` : fmtTokens(v))} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={56} />
              <Tooltip
                formatter={(v: number, n: string) => [metric === 'cost' ? fmtUSD(v, 4) : fmtTokens(v), findModel(n)?.name ?? n]}
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(148,163,184,.08)' }}
              />
              <Legend formatter={(v) => <span className="text-xs text-fg3">{findModel(v)?.name ?? v}</span>} />
              {series.map((s, i) => (
                <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === series.length - 1 ? [3, 3, 0, 0] : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-panel">
        <div className="overflow-x-auto">
        <table className={tbl.table}>
          <thead>
            <tr>
              <th className={tbl.th}>시간</th>
              <th className={tbl.th}>모델</th>
              <th className={tbl.th}>키</th>
              <th className={tbl.th}>리전</th>
              <th className={tbl.thR}>입력 → 출력 토큰</th>
              <th className={tbl.thR}>비용</th>
              <th className={tbl.thR}>첫 토큰</th>
              <th className={tbl.thR}>tok/s</th>
              <th className={tbl.th}>종료</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className={tbl.tr}>
                <td className={cx(tbl.td, 'whitespace-nowrap text-fg2')}>{fmtDateTime(l.ts)}</td>
                <td className={cx(tbl.td, 'whitespace-nowrap font-medium')}>{findModel(l.model)?.name ?? l.model}</td>
                <td className={cx(tbl.td, 'whitespace-nowrap')}>
                  {l.keyName} {l.source === 'playground' && <Badge color="violet">playground</Badge>}
                </td>
                <td className={cx(tbl.td, 'whitespace-nowrap font-mono text-[12.5px] text-fg3')}>{l.endpoint}</td>
                <td className={cx(tbl.tdR, 'whitespace-nowrap text-fg2')}>
                  {l.promptTokens.toLocaleString()} → {l.completionTokens.toLocaleString()}
                </td>
                <td className={tbl.tdR}>{fmtUSD(l.cost, 4)}</td>
                <td className={cx(tbl.tdR, 'whitespace-nowrap text-fg2')}>{l.latency}ms</td>
                <td className={cx(tbl.tdR, 'whitespace-nowrap text-fg2')}>{l.throughput}</td>
                <td className={tbl.td}>
                  <Badge color={l.finish === 'stop' ? 'green' : l.finish === 'error' ? 'rose' : 'amber'}>{l.finish}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px] text-fg3">
          <span>
            {filtered.length ? page * PAGE + 1 : 0}–{Math.min(filtered.length, (page + 1) * PAGE)} / {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              이전
            </Button>
            <Button size="sm" variant="outline" disabled={(page + 1) * PAGE >= filtered.length} onClick={() => setPage(page + 1)}>
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
