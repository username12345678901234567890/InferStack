import { useMemo } from 'react'
import { ORGS, findModel, endpointsFor } from '../../data/models'
import { OrgAvatar } from '../../components/ModelBits'
import { rng } from '../../lib/rand'

/** 1. 제작사 로고 격자 */
export function LogosArt() {
  return (
    <div className="grid grid-cols-6 gap-3">
      {ORGS.slice(0, 18).map((o) => (
        <OrgAvatar key={o.id} org={o.id} name={o.name} size={32} />
      ))}
    </div>
  )
}

/** 2. 한 모델 → 세 리전. 서울이 응답하지 않아 도쿄로 넘어간 상태 */
export function FallbackArt() {
  const m = findModel('deepseek/deepseek-v4.1-flash')!
  const regions = [
    { name: '서울', state: 'down' },
    { name: '도쿄', state: 'active' },
    { name: '버지니아', state: 'idle' },
  ] as const
  return (
    <div className="flex w-full max-w-[230px] flex-col items-center">
      <div className="flex items-center gap-2 rounded-full border border-line2 bg-panel py-1 pl-1 pr-3 text-[12.5px] font-medium shadow-sm">
        <OrgAvatar org={m.org} name={m.orgName} size={20} className="!rounded-full" />
        {m.name}
      </div>
      <svg viewBox="0 0 230 44" className="h-11 w-full" aria-hidden>
        <path d="M115 0 V12 C115 22 38 18 38 30 V44" fill="none" strokeWidth="1.5" className="stroke-line2" strokeDasharray="3 3" />
        <path d="M115 0 V44" fill="none" strokeWidth="2" className="stroke-accent" />
        <path d="M115 0 V12 C115 22 192 18 192 30 V44" fill="none" strokeWidth="1.5" className="stroke-line2" />
      </svg>
      <div className="grid w-full grid-cols-3 gap-2">
        {regions.map((r) => (
          <div
            key={r.name}
            className={
'flex flex-col items-center gap-1 rounded-lg border py-2 text-[12.5px] ' +
              (r.state === 'active' ? 'border-accent bg-accent/[0.08] font-medium text-fg' : 'border-line2 bg-panel text-fg2')
            }
          >
            {r.name}
            <span className={'text-[11px] ' + (r.state === 'down' ? 'text-rose-500' : r.state === 'active' ? 'text-emerald-500' : 'text-fg3')}>
              {r.state === 'down' ? '응답 없음' : r.state === 'active' ? '처리 중' : '대기'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 3. 처리량 / 지연 미니 차트 */
export function MetricsArt() {
  const m = findModel('qwen/qwen3.8-27b')!
  const ep = endpointsFor(m)[0]
  const series = useMemo(() => {
    const r = rng('metrics-art')
    const tps = Array.from({ length: 24 }, (_, i) => ep.throughput * (0.86 + 0.1 * Math.sin(i / 3) + r() * 0.08))
    const lat = Array.from({ length: 24 }, (_, i) => ep.latency * (0.9 + 0.12 * Math.cos(i / 4) + r() * 0.1))
    return { tps, lat }
  }, [ep])
  const line = (arr: number[], h: number) => {
    const max = Math.max(...arr)
    const min = Math.min(...arr)
    return arr.map((v, i) => `${(i / (arr.length - 1)) * 200},${h - 4 - ((v - min) / (max - min || 1)) * (h - 8)}`).join(' ')
  }
  return (
    <div className="w-full max-w-[230px] overflow-hidden rounded-lg border border-line2 bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-3 py-2 text-[12px]">
        <span className="font-medium">{m.name}</span>
        <span className="text-fg3">최근 24시간</span>
      </div>
      <div className="space-y-3 px-3 py-3">
        <div>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-fg3">처리량</span>
            <span className="tabular font-semibold">{ep.throughput} tok/s</span>
          </div>
          <svg viewBox="0 0 200 30" className="mt-1 h-[30px] w-full" preserveAspectRatio="none" aria-hidden>
            <polyline points={line(series.tps, 30)} fill="none" strokeWidth="1.6" className="stroke-accent" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-fg3">첫 토큰 지연</span>
            <span className="tabular font-semibold">{(ep.latency / 1000).toFixed(2)}s</span>
          </div>
          <svg viewBox="0 0 200 30" className="mt-1 h-[30px] w-full" preserveAspectRatio="none" aria-hidden>
            <polyline points={line(series.lat, 30)} fill="none" strokeWidth="1.6" className="stroke-fg2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/** 4. 세 가지 업로드 경로 → 하나의 엔드포인트 */
export function UploadArt() {
  return (
    <div className="flex w-full max-w-[224px] items-center gap-2">
      <div className="flex w-[96px] shrink-0 flex-col gap-2">
        {['Hugging Face', 'ModelScope', 'CLI'].map((s) => (
          <div key={s} className="whitespace-nowrap rounded-md border border-line2 bg-panel py-1.5 text-center text-[11.5px] text-fg2">
            {s}
          </div>
        ))}
      </div>
      <svg viewBox="0 0 20 90" className="h-[90px] w-5 shrink-0" aria-hidden>
        <path d="M0 15 C10 15 10 45 20 45 M0 45 H20 M0 75 C10 75 10 45 20 45" fill="none" strokeWidth="1.5" className="stroke-line2" />
      </svg>
      <div className="min-w-0 flex-1 rounded-lg border border-line2 bg-panel px-2.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
        </div>
        <div className="mt-1 truncate font-mono text-[12px] text-fg">my-model</div>
        <div className="mt-0.5 text-[11.5px] text-fg3">1× L40S</div>
      </div>
    </div>
  )
}
