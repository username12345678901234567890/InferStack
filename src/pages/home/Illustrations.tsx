import { useMemo } from 'react'
import { ORGS, findModel, endpointsFor } from '../../data/models'
import { OrgAvatar } from '../../components/ModelBits'
import { rng } from '../../lib/rand'

/** 1. Grid of lab logos */
export function LogosArt() {
  return (
    <div className="grid grid-cols-6 gap-2.5">
      {ORGS.slice(0, 18).map((o) => (
        <OrgAvatar key={o.id} org={o.id} name={o.name} size={32} />
      ))}
    </div>
  )
}

/** 2. One model → three regions. Virginia stopped responding, Frankfurt took over */
export function FallbackArt() {
  const m = findModel('deepseek/deepseek-v4.1-flash')!
  const regions = [
    { name: 'Virginia', state: 'down' },
    { name: 'Frankfurt', state: 'active' },
    { name: 'Tokyo', state: 'idle' },
  ] as const
  return (
    <div className="flex w-full max-w-[230px] flex-col items-center">
      <div className="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3 text-[12.5px] font-medium shadow-sm">
        <OrgAvatar org={m.org} name={m.orgName} size={20} className="!rounded-full" />
        {m.name}
      </div>
      <svg viewBox="0 0 230 44" className="h-11 w-full" aria-hidden>
        <path d="M115 0 V12 C115 22 38 18 38 30 V44" fill="none" strokeWidth="1.25" className="stroke-fg/20" strokeDasharray="3 3" />
        <path d="M115 0 V44" fill="none" strokeWidth="1.5" className="stroke-fg/70" />
        <path d="M115 0 V12 C115 22 192 18 192 30 V44" fill="none" strokeWidth="1.25" className="stroke-fg/20" />
      </svg>
      <div className="grid w-full grid-cols-3 gap-2">
        {regions.map((r) => (
          <div
            key={r.name}
            className={
'flex flex-col items-center gap-1 rounded-xl border bg-panel py-2 text-[12.5px] ' +
              (r.state === 'active' ? 'border-fg/40 font-medium text-fg shadow-sm' : 'border-line text-fg3')
            }
          >
            {r.name}
            <span className="flex items-center gap-1 text-[11px] font-normal text-fg3">
              <span className={'h-1.5 w-1.5 rounded-full ' + (r.state === 'down' ? 'bg-rose-400' : r.state === 'active' ? 'bg-emerald-500' : 'bg-fg/20')} />
              {r.state === 'down' ? 'Down' : r.state === 'active' ? 'Serving' : 'Standby'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 3. Throughput / latency mini chart */
export function MetricsArt() {
  const m = findModel('qwen/qwen3.8-27b')!
  const ep = endpointsFor(m)[0]
  const series = useMemo(() => {
    const r = rng('metrics-art')
    const tps = Array.from({ length: 12 }, (_, i) => ep.throughput * (0.88 + 0.08 * Math.sin(i / 2) + r() * 0.03))
    const lat = Array.from({ length: 12 }, (_, i) => ep.latency * (0.92 + 0.08 * Math.cos(i / 2.5) + r() * 0.03))
    return { tps, lat }
  }, [ep])
  /** Smooth curve through the points (catmull-rom → bezier) */
  const line = (arr: number[], h: number) => {
    const max = Math.max(...arr)
    const min = Math.min(...arr)
    const pts = arr.map((v, i) => [(i / (arr.length - 1)) * 200, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)])
    let d = `M${pts[0][0]},${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) {
      const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]]
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`
    }
    return d
  }
  return (
    <div className="w-full max-w-[230px] overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-3 py-2 text-[12px]">
        <span className="font-medium">{m.name}</span>
        <span className="text-fg3">Last 24h</span>
      </div>
      <div className="space-y-3 px-3 py-3">
        <div>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-fg3">Throughput</span>
            <span className="tabular font-semibold">{ep.throughput} tok/s</span>
          </div>
          <svg viewBox="0 0 200 30" className="mt-1 h-[30px] w-full" preserveAspectRatio="none" aria-hidden>
            <path d={line(series.tps, 30)} fill="none" strokeWidth="1.5" className="stroke-accent" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-fg3">Latency</span>
            <span className="tabular font-semibold">{(ep.latency / 1000).toFixed(2)}s</span>
          </div>
          <svg viewBox="0 0 200 30" className="mt-1 h-[30px] w-full" preserveAspectRatio="none" aria-hidden>
            <path d={line(series.lat, 30)} fill="none" strokeWidth="1.5" className="stroke-fg/40" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/** 4. Three upload paths → one endpoint */
export function UploadArt() {
  return (
    <div className="flex w-full max-w-[224px] items-center gap-2">
      <div className="flex w-[96px] shrink-0 flex-col gap-2">
        {['Hugging Face', 'ModelScope', 'CLI'].map((s) => (
          <div key={s} className="whitespace-nowrap rounded-md border border-line bg-panel py-1.5 text-center text-[11.5px] text-fg2">
            {s}
          </div>
        ))}
      </div>
      <svg viewBox="0 0 20 90" className="h-[90px] w-5 shrink-0" aria-hidden>
        <path d="M0 15 C10 15 10 45 20 45 M0 45 H20 M0 75 C10 75 10 45 20 45" fill="none" strokeWidth="1.25" className="stroke-fg/25" />
      </svg>
      <div className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-2.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
        </div>
        <div className="mt-1 truncate font-mono text-[12px] text-fg">my-model</div>
        <div className="mt-0.5 text-[11.5px] text-fg3">1× L40S</div>
      </div>
    </div>
  )
}
