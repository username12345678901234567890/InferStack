import { useMemo } from 'react'
import { MODELS, ORGS, endpointsFor } from '../../data/models'
import { OrgAvatar } from '../../components/ModelBits'

/** 1. 제작사 로고 격자 */
export function LogoGridViz() {
  const orgs = ORGS.slice(0, 18)
  return (
    <div className="grid grid-cols-6 gap-2.5">
      {orgs.map((o, i) => (
        <span key={o.id} className={i % 7 === 3 || i % 5 === 4 ? 'opacity-90' : ''}>
          <OrgAvatar org={o.id} name={o.name} size={28} />
        </span>
      ))}
    </div>
  )
}

/** 2. 리전 폴백: 서울 장애 → 도쿄로 재시도. viewBox는 카드 안쪽 실제 픽셀 크기와 같다. */
export function RoutingViz() {
  const nodes = [
    { y: 24, name: 'seoul', note: '503', state: 'down' },
    { y: 74, name: 'tokyo', note: '142ms', state: 'active' },
    { y: 124, name: 'virginia', note: '대기', state: 'idle' },
  ] as const
  return (
    <svg viewBox="0 0 232 148" className="h-auto w-full max-w-[232px]" role="img" aria-label="서울 리전 장애 시 도쿄 리전으로 재시도">
      <rect x="1" y="60" width="50" height="28" rx="7" className="fill-panel stroke-line2" />
      <text x="26" y="78.5" textAnchor="middle" className="fill-fg" fontSize="12" fontWeight="500">
        요청
      </text>
      {nodes.map((n) => {
        const d = `M51 74 C 82 74, 88 ${n.y}, 118 ${n.y}`
        const active = n.state === 'active'
        return (
          <g key={n.name}>
            <path d={d} fill="none" strokeWidth={active ? 1.8 : 1.2} strokeDasharray={n.state === 'down' ? '3 3' : n.state === 'idle' ? '1 3' : undefined} className={active ? 'stroke-accent' : 'stroke-fg3'} />
            <rect x="118" y={n.y - 14} width="113" height="28" rx="7" className={active ? 'fill-panel stroke-accent' : 'fill-panel stroke-line2'} />
            <circle cx="130" cy={n.y} r="3.2" className={n.state === 'down' ? 'fill-rose-500' : active ? 'fill-emerald-500' : 'fill-fg3'} />
            <text x="139" y={n.y + 4} className={active ? 'fill-fg' : 'fill-fg2'} fontSize="11.5">
              {n.name}
            </text>
            <text x="224" y={n.y + 4} textAnchor="end" className={n.state === 'down' ? 'fill-rose-500 font-mono' : 'fill-fg3 font-mono'} fontSize="10.5">
              {n.note}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** 3. 가격 대비 처리량 산점도 (카탈로그 전체 36개) */
export function PriceViz() {
  const W = 232
  const H = 148
  const pad = { l: 4, r: 4, t: 18, b: 22 }
  const pts = useMemo(
    () =>
      MODELS.map((m) => ({
        slug: m.slug,
        price: m.price.output,
        tps: Math.max(...endpointsFor(m).map((e) => e.throughput)),
      })),
    [],
  )
  const xMin = Math.log10(0.03)
  const xMax = Math.log10(5)
  const yMax = Math.max(...pts.map((p) => p.tps)) * 1.1
  const x = (v: number) => pad.l + ((Math.log10(v) - xMin) / (xMax - xMin)) * (W - pad.l - pad.r)
  const y = (v: number) => H - pad.b - (v / yMax) * (H - pad.t - pad.b)
  const labels: Record<string, string> = { 'openai/gpt-oss-20b': 'gpt-oss-20b', 'z-ai/glm-5.3': 'GLM-5.3' }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[232px]" role="img" aria-label="모델별 출력 가격과 처리량">
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} className="stroke-line2" />
      {[0.1, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} className="stroke-line" strokeDasharray="2 3" />
          <text x={x(t)} y={H - 6} textAnchor="middle" fontSize="10.5" className="fill-fg3 font-mono">
            ${t}
          </text>
        </g>
      ))}
      <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="10.5" className="fill-fg3">
        출력 $/1M
      </text>
      <text x={pad.l} y={10} fontSize="10.5" className="fill-fg3">
        tok/s
      </text>
      {pts.map((p) => (
        <circle key={p.slug} cx={x(p.price)} cy={y(p.tps)} r={labels[p.slug] ? 4 : 2.8} className={labels[p.slug] ? 'fill-accent' : 'fill-fg3'} opacity={labels[p.slug] ? 1 : 0.5} />
      ))}
      {pts
        .filter((p) => labels[p.slug])
        .map((p) => {
          const right = x(p.price) > W * 0.6
          return (
            <text key={p.slug} x={x(p.price) + (right ? -8 : 8)} y={y(p.tps) + 4} textAnchor={right ? 'end' : 'start'} fontSize="11" fontWeight="500" className="fill-fg stroke-panel" strokeWidth={4} strokeLinejoin="round" style={{ paintOrder: 'stroke' }}>
              {labels[p.slug]}
            </text>
          )
        })}
    </svg>
  )
}

/** 4. 내 모델 업로드 파이프라인 */
export function PipelineViz() {
  const rows = [
    { k: '가져오기', v: 'Qwen/Qwen3.8-27B' },
    { k: '런타임', v: 'FP8 · vLLM' },
    { k: '엔드포인트', v: 'demo/qwen-27b', live: true },
  ]
  return (
    <div className="relative flex w-full flex-col gap-2.5">
      <span className="absolute bottom-4 left-[11px] top-4 w-px bg-line2" />
      {rows.map((r) => (
        <div key={r.k} className="relative grid grid-cols-[23px_1fr] items-center gap-2.5">
          <span className="z-10 mx-auto flex h-[9px] w-[9px] rounded-full border border-fg3 bg-panel">{r.live && <span className="m-auto h-[9px] w-[9px] rounded-full bg-emerald-500" />}</span>
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5">
            <span className="text-[11px] text-fg3">{r.k}</span>
            <span className={'truncate font-mono text-[11px] ' + (r.live ? 'text-emerald-600 dark:text-emerald-400' : 'text-fg')}>{r.v}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
